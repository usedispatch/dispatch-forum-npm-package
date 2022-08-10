import { DispatchClientError } from '../types/loading';
import { dispatchClientError } from './loading';

/**
 * Attempt to parse a URL from a string. On success, return the
 * URL object. On failure, return a DispatchClientError.
 *
 * TODO(andrew) make the Error type more generic in naming. This
 * function's error result doesn't have anything to do with the
 * Dispatch Client, so the fact that it returns thie error is
 * misleading
 */
export function stringToURL(text: string): URL | DispatchClientError {
  try {
    return new URL(text);
  } catch (e) {
    return dispatchClientError(e);
  }
}
