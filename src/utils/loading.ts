import { Loading, LoadingResult } from '../types/loading';

/**
 * Return the same object as a Result iff the given loading
 * object has either succeeded or failed. If not, return null
 */
export function resolved<T>(loading: Loading<T>): LoadingResult<T> | null {
  if (
    loading.state === 'success' ||
    loading.state === 'dispatchClientError' ||
    loading.state === 'onChainAccountNotFound'
  ) {
    return loading;
  } else {
    return null;
  }
}
