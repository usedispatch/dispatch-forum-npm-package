import {
  Loading,
  LoadingResult,
  Initial,
  OnChainAccountNotFound,
  DispatchClientError,
  Pending
} from '../types/loading';

/**
 * Return whether a given Loading value is a success or not, and
 * narrow its type
 */
export function isSuccess<T>(value: Loading<T>): value is T {
  // Every kind of `Loading` type is tagged with a
  // `loadingState`, except for `T`, which is not. Note that this
  // type checking means that `Loading` object should not be
  // nested within each other.
  return !('loadingState' in value);
}

/**
 * Return whether a given Loading value is a success or not, and
 * narrow its type
 */
export function isDispatchClientError<T>(value: Loading<T>): value is DispatchClientError {
  return (
    'loadingState' in value &&
    value.loadingState === 'dispatchClientError'
  );
}

/**
 * Return whether a given Loading value is a "not found" result
 * or not, and narrow its type
 */
export function isNotFound<T>(value: Loading<T>): value is OnChainAccountNotFound {
  return (
    'loadingState' in value &&
    value.loadingState === 'dispatchClientError'
  );
}

/**
 * Return whether the given object is resolved-- that is whether
 * it has entered its final state, whether success, error, or not
 * found. If the object is in the initial or pending state, it
 * still has time to go, so return false
 */
export function isResolved<T>(value: Loading<T>): value is LoadingResult<T> {
  return (
    isSuccess(value) ||
    value.loadingState === 'dispatchClientError' ||
    value.loadingState === 'onChainAccountNotFound'
  );
}

export function isInitial<T>(value: Loading<T>): value is Initial {
  return (
    'loadingState' in value &&
    value.loadingState === 'initial'
  );
}

export function isPending<T>(value: Loading<T>): value is Pending {
  return (
    'loadingState' in value &&
    value.loadingState === 'pending'
  );
}

/**
 * Type constructors
 */

export function onChainAccountNotFound(): OnChainAccountNotFound {
  return { loadingState: 'onChainAccountNotFound' };
}

export function pending(): Pending {
  return { loadingState: 'pending' };
}

export function initial(): Initial {
  return { loadingState: 'initial' };
}

export function dispatchClientError(error?: any): DispatchClientError {
  return { loadingState: 'dispatchClientError', error };
}
