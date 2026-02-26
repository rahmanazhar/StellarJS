/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic require() for optional peer dependency — types are unavailable at compile time
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { createLogger } from '../utils/helpers';

const logger = createLogger('ImageOptimizer');

export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png';

export interface ImageOptimizerOptions {
  /** Directory where original images are stored */
  sourceDir?: string;
  /** Directory for cached optimized images */
  cacheDir?: string;
  /** Default output format (default: 'webp') */
  defaultFormat?: ImageFormat;
  /** JPEG/WebP quality 1-100 (default: 80) */
  quality?: number;
  /** Max width to allow via query param (default: 3840) */
  maxWidth?: number;
  /** Enable in-memory cache (default: true) */
  memoryCache?: boolean;
}

export interface OptimizeOptions {
  width?: number;
  height?: number;
  format?: ImageFormat;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
}

export class ImageOptimizer {
  private options: Required<ImageOptimizerOptions>;
  private memCache = new Map<string, { buffer: Buffer; format: string; timestamp: number }>();

  constructor(options: ImageOptimizerOptions = {}) {
    this.options = {
      sourceDir: options.sourceDir || 'public',
      cacheDir: options.cacheDir || '.stellar/image-cache',
      defaultFormat: options.defaultFormat || 'webp',
      quality: options.quality ?? 80,
      maxWidth: options.maxWidth || 3840,
      memoryCache: options.memoryCache !== false,
    };

    // Ensure cache directory exists
    fs.mkdirSync(this.options.cacheDir, { recursive: true });
  }

  async optimize(
    inputPath: string,
    opts: OptimizeOptions = {}
  ): Promise<{ buffer: Buffer; format: string }> {
    const format = opts.format || this.options.defaultFormat;
    const cacheKey = this.buildCacheKey(inputPath, opts);

    // Check memory cache
    if (this.options.memoryCache && this.memCache.has(cacheKey)) {
      const cached = this.memCache.get(cacheKey);
      if (cached) return cached;
    }

    // Check disk cache
    const diskCachePath = path.join(this.options.cacheDir, `${cacheKey}.${format}`);
    if (fs.existsSync(diskCachePath)) {
      const buffer = fs.readFileSync(diskCachePath);
      const result = { buffer, format };
      if (this.options.memoryCache)
        this.memCache.set(cacheKey, { ...result, timestamp: Date.now() });
      return result;
    }

    // Process with Sharp
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require('sharp');

      let pipeline = sharp(inputPath);

      if (opts.width || opts.height) {
        pipeline = pipeline.resize({
          width: opts.width ? Math.min(opts.width, this.options.maxWidth) : undefined,
          height: opts.height,
          fit: opts.fit || 'inside',
          withoutEnlargement: true,
        });
      }

      if (opts.blur) {
        pipeline = pipeline.blur(opts.blur);
      }

      const quality = opts.quality || this.options.quality;

      switch (format) {
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
        case 'avif':
          pipeline = pipeline.avif({ quality });
          break;
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality });
          break;
        case 'png':
          pipeline = pipeline.png({ compressionLevel: Math.round((100 - quality) / 10) });
          break;
      }

      const buffer = await pipeline.toBuffer();

      // Write to disk cache
      fs.writeFileSync(diskCachePath, buffer);

      // Store in memory cache
      const result = { buffer, format };
      if (this.options.memoryCache)
        this.memCache.set(cacheKey, { ...result, timestamp: Date.now() });

      return result;
    } catch (e: any) {
      if (e.code === 'MODULE_NOT_FOUND') {
        throw new Error('Image optimization requires sharp. Run: npm install sharp');
      }
      throw e;
    }
  }

  /** Express request handler for image optimization endpoint */
  createHandler(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const { src, w, h, q, f, fit, blur } = req.query as Record<string, string>;

      if (!src) {
        res.status(400).json({ error: 'src parameter is required' });
        return;
      }

      // Prevent path traversal
      const safeSrc = path.normalize(src).replace(/^(\.\.[/\\])+/, '');
      const inputPath = path.join(this.options.sourceDir, safeSrc);

      if (!fs.existsSync(inputPath)) {
        res.status(404).json({ error: 'Image not found' });
        return;
      }

      try {
        const opts: OptimizeOptions = {
          width: w ? parseInt(w) : undefined,
          height: h ? parseInt(h) : undefined,
          quality: q ? parseInt(q) : undefined,
          format: (f as ImageFormat) || undefined,
          fit: (fit as any) || undefined,
          blur: blur ? parseFloat(blur) : undefined,
        };

        const { buffer, format } = await this.optimize(inputPath, opts);
        const mimeTypes: Record<string, string> = {
          webp: 'image/webp',
          avif: 'image/avif',
          jpeg: 'image/jpeg',
          png: 'image/png',
        };

        res.setHeader('Content-Type', mimeTypes[format] || 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('X-Stellar-Image', 'optimized');
        res.send(buffer);
      } catch (error: any) {
        logger.error('Image optimization failed:', error);
        res.status(500).json({ error: error.message });
      }
    };
  }

  private buildCacheKey(inputPath: string, opts: OptimizeOptions): string {
    const parts = [
      path.basename(inputPath, path.extname(inputPath)),
      opts.width || 'auto',
      opts.height || 'auto',
      opts.quality || this.options.quality,
      opts.format || this.options.defaultFormat,
      opts.fit || 'inside',
      opts.blur || '0',
    ];
    return parts.join('_');
  }

  clearCache(): void {
    this.memCache.clear();
    const files = fs.readdirSync(this.options.cacheDir);
    files.forEach((f) => fs.unlinkSync(path.join(this.options.cacheDir, f)));
    logger.info('Image cache cleared');
  }
}

let globalOptimizer: ImageOptimizer | null = null;

export const initImageOptimizer = (options?: ImageOptimizerOptions): ImageOptimizer => {
  globalOptimizer = new ImageOptimizer(options);
  return globalOptimizer;
};

export const getImageOptimizer = (): ImageOptimizer | null => globalOptimizer;
