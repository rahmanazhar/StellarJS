import {
  createLogger,
  formatError,
  tryCatch,
  retry,
  sleep,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  randomString,
  uuid,
} from '../src/utils/helpers';

describe('Utility Helpers', () => {
  describe('createLogger', () => {
    it('should create a logger with context', () => {
      const logger = createLogger('TestContext');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
    });

    it('should log messages with context', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const logger = createLogger('Test');

      logger.info('test message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('formatError', () => {
    it('should format Error objects', () => {
      const error = new Error('Test error');
      const formatted = formatError(error);
      expect(formatted).toContain('Test error');
    });

    it('should format string errors', () => {
      const formatted = formatError('String error');
      expect(formatted).toBe('String error');
    });

    it('should format unknown errors', () => {
      const formatted = formatError({ message: 'Object error' });
      expect(formatted).toBeTruthy();
    });
  });

  describe('tryCatch', () => {
    it('should execute function and return result', async () => {
      const result = await tryCatch(async () => 'success');
      expect(result).toEqual({ success: true, data: 'success' });
    });

    it('should catch errors', async () => {
      const result = await tryCatch(async () => {
        throw new Error('Test error');
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('retry', () => {
    jest.useFakeTimers();

    it('should retry failed operations', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Fail');
        }
        return 'success';
      });

      const promise = retry(fn, 3, 100);

      for (let i = 0; i < 3; i++) {
        await jest.runAllTimersAsync();
      }

      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn(async () => {
        throw new Error('Always fails');
      });

      await expect(retry(fn, 2, 100)).rejects.toThrow('Always fails');
    });

    jest.useRealTimers();
  });

  describe('sleep', () => {
    jest.useFakeTimers();

    it('should delay execution', async () => {
      const start = Date.now();
      const promise = sleep(1000);

      jest.advanceTimersByTime(1000);
      await promise;

      expect(jest.now() - start).toBeGreaterThanOrEqual(1000);
    });

    jest.useRealTimers();
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      expect(func).not.toHaveBeenCalled();

      jest.runAllTimers();

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass latest arguments', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc('first');
      debouncedFunc('second');
      debouncedFunc('third');

      jest.runAllTimers();

      expect(func).toHaveBeenCalledWith('third');
    });

    jest.useRealTimers();
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    it('should throttle function calls', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 1000);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('should throttle with correct timing', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 1000);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(500);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);

      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, { a: 3 }];
      const cloned = deepClone(arr);

      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    it('should handle null and undefined', () => {
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01');
      const cloned = deepClone(date);

      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
    });

    it('should handle nested structures', () => {
      const complex = {
        arr: [1, 2, { nested: { deep: 'value' } }],
        obj: { x: 1, y: { z: 2 } },
        date: new Date(),
      };
      const cloned = deepClone(complex);

      expect(cloned).toEqual(complex);
      expect(cloned.arr[2]).not.toBe(complex.arr[2]);
      expect(cloned.obj.y).not.toBe(complex.obj.y);
    });
  });

  describe('isEmpty', () => {
    it('should check if value is empty', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('randomString', () => {
    it('should generate random strings', () => {
      const str1 = randomString();
      const str2 = randomString();

      expect(str1).not.toBe(str2);
      expect(str1.length).toBe(32);
    });

    it('should generate strings with custom length', () => {
      const str = randomString(16);
      expect(str.length).toBe(16);
    });

    it('should generate alphanumeric strings', () => {
      const str = randomString(20);
      expect(str).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  describe('uuid', () => {
    it('should generate valid UUIDs', () => {
      const id = uuid();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UUIDs', () => {
      const id1 = uuid();
      const id2 = uuid();
      expect(id1).not.toBe(id2);
    });

    it('should always have version 4 format', () => {
      const id = uuid();
      expect(id[14]).toBe('4');
    });
  });
});
