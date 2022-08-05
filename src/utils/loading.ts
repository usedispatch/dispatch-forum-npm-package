import {
  Loading,
  LoadingResult,
  Success,
  OnChainAccountNotFound,
  DispatchClientError
} from '../types/loading';

/**
 * Create a new Success type from a given value
 */
export function success<T>(t: T): Success<T> {
  if (t instanceof Array) {
    const copy = Array.from(t) as unknown;
    const result = copy as Success<T>;
    result.state = 'success';
    return result;
  } else {
    return { state: 'success', ... t };
  }
}

/**
 * Return whether a given Loading value is a success or not, and
 * narrow its type
 */
export function isSuccess<T>(value: Loading<T>): value is Success<T> {
  return value.state === 'success';
}

/**
 * Return whether a given Loading value is a success or not, and
 * narrow its type
 */
export function isError<T>(value: Loading<T>): value is DispatchClientError {
  return value.state === 'dispatchClientError';
}

/**
 * Return whether a given Loading value is a "not found" result
 * or not, and narrow its type
 */
export function isNotFound<T>(value: Loading<T>): value is OnChainAccountNotFound {
  return value.state === 'onChainAccountNotFound';
}

/**
 * Return whether the given object is resolved-- that is whether
 * it has entered its final state, whether success, error, or not
 * found. If the object is in the initial or pending state, it
 * still has time to go, so return false
 */
export function isResolved<T>(value: Loading<T>): value is LoadingResult<T> {
  if (
    value.state === 'success' ||
    value.state === 'dispatchClientError' ||
    value.state === 'onChainAccountNotFound'
  ) {
    return true;
  } else {
    return false;
  }
}
