import { Result } from '@types';
import { uncategorizedError } from '../utils/error';

/**
 * Attempt to parse a URL from a string. On success, return the
 * URL object. On failure, return a DispatchClientError.
 *
 * TODO(andrew) make the Error type more generic in naming. This
 * function's error result doesn't have anything to do with the
 * Dispatch Client, so the fact that it returns thie error is
 * misleading
 */
export function stringToURL(text: string): Result<URL> {
  try {
    return new URL(text);
  } catch (e) {
    // TODO categorize this
    return uncategorizedError(e);
  }
}
