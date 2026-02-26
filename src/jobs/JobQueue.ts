/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic require() for optional peer dependency — types are unavailable at compile time
import { createLogger } from '../utils/helpers';

const logger = createLogger('JobQueue');

export interface JobOptions {
  /** Number of retry attempts on failure (default: 3) */
  retries?: number;
  /** Backoff strategy (default: 'exponential') */
  backoff?: 'exponential' | 'linear' | 'fixed';
  /** Base delay in ms for backoff (default: 1000) */
  backoffDelay?: number;
  /** Job priority (lower = higher priority, default: 0) */
  priority?: number;
  /** Delay before processing in ms */
  delay?: number;
  /** Remove job after completion (default: true) */
  removeOnComplete?: boolean;
  /** Remove job after failure (default: false) */
  removeOnFail?: boolean;
}

export type JobHandler<TPayload = any> = (payload: TPayload, jobId: string) => Promise<void>;

export interface JobDefinition<TPayload = any> {
  name: string;
  handler: JobHandler<TPayload>;
  options?: JobOptions;
}

export interface ScheduledJob {
  name: string;
  cron: string;
  handler: () => Promise<void>;
}

export interface QueueOptions {
  /** Redis connection string (required for BullMQ) */
  redis?: string;
  /** Use in-memory queue as fallback (default: false) */
  inMemoryFallback?: boolean;
}

/** Simple in-memory queue for development / when Redis is unavailable */
class InMemoryQueue {
  private jobs = new Map<string, JobDefinition>();
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private scheduledJobs = new Map<string, ScheduledJob>();

  define<TPayload>(definition: JobDefinition<TPayload>): void {
    this.jobs.set(definition.name, definition as JobDefinition);
  }

  async dispatch<TPayload>(name: string, payload: TPayload, options?: JobOptions): Promise<string> {
    const jobDef = this.jobs.get(name);
    if (!jobDef) throw new Error(`Job '${name}' is not defined`);

    const jobId = `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const delay = options?.delay || 0;

    setTimeout(async () => {
      const retries = options?.retries ?? jobDef.options?.retries ?? 3;
      const backoffDelay = options?.backoffDelay ?? jobDef.options?.backoffDelay ?? 1000;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          await jobDef.handler(payload, jobId);
          return;
        } catch (error) {
          if (attempt < retries) {
            const wait =
              options?.backoff === 'linear'
                ? backoffDelay * (attempt + 1)
                : options?.backoff === 'fixed'
                ? backoffDelay
                : backoffDelay * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, wait));
          } else {
            logger.error(`Job '${name}' failed after ${retries + 1} attempts:`, error);
          }
        }
      }
    }, delay);

    return jobId;
  }

  schedule(job: ScheduledJob): void {
    this.scheduledJobs.set(job.name, job);
    const ms = this.cronToMs(job.cron);
    if (ms > 0) {
      const timer = setInterval(async () => {
        try {
          await job.handler();
        } catch (error) {
          logger.error(`Scheduled job '${job.name}' failed:`, error);
        }
      }, ms);
      this.timers.set(job.name, timer);
    }
  }

  unschedule(name: string): void {
    const timer = this.timers.get(name);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(name);
    }
    this.scheduledJobs.delete(name);
  }

  listJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  listScheduled(): string[] {
    return Array.from(this.scheduledJobs.keys());
  }

  // Parse simple cron expressions like "* /5 * * * *" (minute interval) → ms
  private cronToMs(cron: string): number {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return 0;
    const [minute] = parts;
    // Handle simple */N minute intervals
    const match = minute.match(/^\*\/(\d+)$/);
    if (match) return parseInt(match[1]) * 60 * 1000;
    return 60 * 1000; // default 1 minute
  }
}

/** BullMQ-backed production queue */
class BullMQQueue {
  private queues = new Map<string, any>();
  private workers = new Map<string, any>();
  private schedulers = new Map<string, any>();
  private jobs = new Map<string, JobDefinition>();
  private redisConnection: any;

  constructor(redisUrl: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    this.redisConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  }

  define<TPayload>(definition: JobDefinition<TPayload>): void {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Queue, Worker } = require('bullmq');
    this.jobs.set(definition.name, definition as JobDefinition);

    const queue = new Queue(definition.name, { connection: this.redisConnection });
    this.queues.set(definition.name, queue);

    const worker = new Worker(
      definition.name,
      async (job: any) => {
        await (definition.handler as JobHandler)(job.data, job.id);
      },
      { connection: this.redisConnection }
    );

    worker.on('failed', (job: any, err: Error) => {
      logger.error(`Job '${definition.name}' failed (id: ${job?.id}):`, err);
    });

    this.workers.set(definition.name, worker);
  }

  async dispatch<TPayload>(name: string, payload: TPayload, options?: JobOptions): Promise<string> {
    const queue = this.queues.get(name);
    if (!queue) throw new Error(`Job '${name}' is not defined`);

    const job = await queue.add(name, payload, {
      attempts: (options?.retries ?? 3) + 1,
      backoff: {
        type: options?.backoff || 'exponential',
        delay: options?.backoffDelay || 1000,
      },
      priority: options?.priority,
      delay: options?.delay,
      removeOnComplete: options?.removeOnComplete !== false,
      removeOnFail: options?.removeOnFail === true,
    });

    return job.id;
  }

  schedule(job: ScheduledJob): void {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Queue, Worker } = require('bullmq');
    const queue = new Queue(job.name, { connection: this.redisConnection });
    queue.add(job.name, {}, { repeat: { cron: job.cron }, removeOnComplete: true });

    const worker = new Worker(
      job.name,
      async () => {
        await job.handler();
      },
      { connection: this.redisConnection }
    );

    this.schedulers.set(job.name, { queue, worker });
  }

  unschedule(name: string): void {
    const entry = this.schedulers.get(name);
    if (entry) {
      entry.queue.close();
      entry.worker.close();
      this.schedulers.delete(name);
    }
  }

  listJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  listScheduled(): string[] {
    return Array.from(this.schedulers.keys());
  }
}

type AnyQueue = InMemoryQueue | BullMQQueue;

export class JobManager {
  private queue: AnyQueue;
  private useBullMQ: boolean;

  constructor(options: QueueOptions = {}) {
    if (options.redis) {
      try {
        require('bullmq');
        require('ioredis');
        this.queue = new BullMQQueue(options.redis);
        this.useBullMQ = true;
        logger.info('Job queue using BullMQ (Redis)');
      } catch (e: any) {
        if (options.inMemoryFallback) {
          logger.warn('BullMQ/ioredis not installed, using in-memory queue');
          this.queue = new InMemoryQueue();
          this.useBullMQ = false;
        } else {
          throw new Error('Job queue requires bullmq + ioredis. Run: npm install bullmq ioredis');
        }
      }
    } else {
      this.queue = new InMemoryQueue();
      this.useBullMQ = false;
      logger.info('Job queue using in-memory (development)');
    }
  }

  /** Define a job handler */
  defineJob<TPayload = any>(definition: JobDefinition<TPayload>): void {
    this.queue.define(definition);
  }

  /** Dispatch a job to the queue */
  async dispatch<TPayload = any>(
    name: string,
    payload: TPayload,
    options?: JobOptions
  ): Promise<string> {
    return this.queue.dispatch(name, payload, options);
  }

  /** Schedule a recurring job with a cron expression */
  scheduleJob(job: ScheduledJob): void {
    this.queue.schedule(job);
  }

  /** Remove a scheduled job */
  unscheduleJob(name: string): void {
    this.queue.unschedule(name);
  }

  isUsingBullMQ(): boolean {
    return this.useBullMQ;
  }

  listJobs(): string[] {
    return this.queue.listJobs();
  }

  listScheduled(): string[] {
    return this.queue.listScheduled();
  }
}

let globalJobManager: JobManager | null = null;

export const initJobQueue = (options?: QueueOptions): JobManager => {
  globalJobManager = new JobManager(options);
  return globalJobManager;
};

export const getJobQueue = (): JobManager => {
  if (!globalJobManager) throw new Error('Job queue not initialized. Call initJobQueue() first.');
  return globalJobManager;
};
