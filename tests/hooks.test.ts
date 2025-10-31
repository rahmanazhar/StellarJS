import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useAsync,
  useLocalStorage,
  useSessionStorage,
  useDebounce,
  useToggle,
  usePrevious,
  useMount,
  useUnmount,
  useInterval,
  useWindowSize,
} from '../src/hooks';

describe('Hooks Tests', () => {
  describe('useAsync', () => {
    it('should handle successful async operation', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const { result } = renderHook(() => useAsync(asyncFn));

      expect(result.current.status).toBe('idle');
      expect(result.current.isIdle).toBe(true);

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.status).toBe('success');
      expect(result.current.data).toBe('success');
      expect(result.current.isSuccess).toBe(true);
    });

    it('should handle async errors', async () => {
      const error = new Error('Test error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(() => useAsync(asyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toEqual(error);
      expect(result.current.isError).toBe(true);
    });

    it('should execute immediately if immediate is true', async () => {
      const asyncFn = jest.fn().mockResolvedValue('immediate');
      renderHook(() => useAsync(asyncFn, true));

      await waitFor(() => {
        expect(asyncFn).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('useLocalStorage', () => {
    beforeEach(() => {
      localStorage.clear();
      jest.clearAllMocks();
    });

    it('should initialize with default value', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
      expect(result.current[0]).toBe('default');
    });

    it('should update localStorage when value changes', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
      expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('updated'));
    });

    it('should remove item when set to undefined', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1](undefined);
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle complex objects', () => {
      const obj = { name: 'test', value: 123 };
      const { result } = renderHook(() => useLocalStorage('test-obj', obj));

      expect(result.current[0]).toEqual(obj);

      act(() => {
        result.current[1]({ name: 'updated', value: 456 });
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test-obj',
        JSON.stringify({ name: 'updated', value: 456 })
      );
    });
  });

  describe('useSessionStorage', () => {
    beforeEach(() => {
      sessionStorage.clear();
      jest.clearAllMocks();
    });

    it('should initialize with default value', () => {
      const { result } = renderHook(() => useSessionStorage('test-key', 'default'));
      expect(result.current[0]).toBe('default');
    });

    it('should update sessionStorage when value changes', () => {
      const { result } = renderHook(() => useSessionStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
      expect(sessionStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('updated'));
    });
  });

  describe('useDebounce', () => {
    jest.useFakeTimers();

    it('should debounce the value', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'updated' });
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('should cancel previous timeout on rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'update1' });
      act(() => {
        jest.advanceTimersByTime(250);
      });

      rerender({ value: 'update2' });
      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(result.current).toBe('update2');
    });

    jest.useRealTimers();
  });

  describe('useToggle', () => {
    it('should toggle boolean value', () => {
      const { result } = renderHook(() => useToggle(false));

      expect(result.current[0]).toBe(false);

      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);

      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(false);
    });

    it('should set specific value', () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current[2](true);
      });

      expect(result.current[0]).toBe(true);

      act(() => {
        result.current[2](false);
      });

      expect(result.current[0]).toBe(false);
    });

    it('should default to false if no initial value', () => {
      const { result } = renderHook(() => useToggle());

      expect(result.current[0]).toBe(false);
    });
  });

  describe('usePrevious', () => {
    it('should return previous value', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => usePrevious(value),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBeUndefined();

      rerender({ value: 'updated' });
      expect(result.current).toBe('initial');

      rerender({ value: 'final' });
      expect(result.current).toBe('updated');
    });

    it('should work with different types', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: number }) => usePrevious(value),
        { initialProps: { value: 1 } }
      );

      expect(result.current).toBeUndefined();

      rerender({ value: 2 });
      expect(result.current).toBe(1);

      rerender({ value: 3 });
      expect(result.current).toBe(2);
    });
  });

  describe('useMount', () => {
    it('should call callback on mount', () => {
      const callback = jest.fn();
      renderHook(() => useMount(callback));

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback on rerender', () => {
      const callback = jest.fn();
      const { rerender } = renderHook(() => useMount(callback));

      expect(callback).toHaveBeenCalledTimes(1);

      rerender();
      rerender();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('useUnmount', () => {
    it('should call callback on unmount', () => {
      const callback = jest.fn();
      const { unmount } = renderHook(() => useUnmount(callback));

      expect(callback).not.toHaveBeenCalled();

      unmount();

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not call callback on rerender', () => {
      const callback = jest.fn();
      const { rerender, unmount } = renderHook(() => useUnmount(callback));

      rerender();
      rerender();

      expect(callback).not.toHaveBeenCalled();

      unmount();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('useInterval', () => {
    jest.useFakeTimers();

    it('should call callback at specified interval', () => {
      const callback = jest.fn();
      renderHook(() => useInterval(callback, 1000));

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should stop interval when delay is null', () => {
      const callback = jest.fn();
      const { rerender } = renderHook(
        ({ delay }: { delay: number | null }) => useInterval(callback, delay),
        { initialProps: { delay: 1000 } }
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);

      rerender({ delay: null });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  describe('useWindowSize', () => {
    it('should return initial window size', () => {
      const { result } = renderHook(() => useWindowSize());

      expect(result.current).toEqual({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    });

    it('should update on window resize', () => {
      const { result } = renderHook(() => useWindowSize());

      act(() => {
        Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
        Object.defineProperty(window, 'innerHeight', { writable: true, value: 768 });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current).toEqual({
        width: 1024,
        height: 768,
      });
    });
  });
});
