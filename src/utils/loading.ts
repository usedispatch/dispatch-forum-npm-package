import {
  isError
} from './error';
import {
  Loading,
  Initial,
  Pending
} from '@types';
import { Result } from '@types';

/**
 * Return whether a given Loading value is a success or not, and
 * narrow its type
 */
export function isSuccess<T>(value: Loading<T>): value is T {
  return isResult(value) && !isError(value);
}

/**
 * Return whether the given object is resolved-- that is whether
 * it has entered its final state, whether success, error, or not
 * found. If the object is in the initial or pending state, it
 * still has time to go, so return false
 */
export function isResult<T>(value: Loading<T>): value is Result<T> {
  // Is this some kind of loading object, such as initial or pending?
  const isLoading = typeof value === 'object' && 'loadingState' in value;
  return !isLoading;
}

export function isInitial<T>(value: Loading<T>): value is Initial {
  return (
    typeof value === 'object' &&
    'loadingState' in value &&
    value.loadingState === 'initial'
  );
}

export function isPending<T>(value: Loading<T>): value is Pending {
  return (
    typeof value === 'object' &&
    'loadingState' in value &&
    value.loadingState === 'pending'
  );
}

/**
 * Type constructors
 */

export function pending(): Pending {
  return { loadingState: 'pending' };
}

export function initial(): Initial {
  return { loadingState: 'initial' };
}
