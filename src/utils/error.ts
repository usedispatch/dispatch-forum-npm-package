import {
  NotFoundError,
  UnknownError,
  Result,
  DispatchError,
  BadInputError
} from '../types/error';

export function isError<T>(
  value: Result<T>
): value is DispatchError {
  return 'errorKind' in value;
}

/*
 * Type constructors
 */
export function notFoundError(
  message: string
): NotFoundError {
  return {
    errorKind: 'NotFound',
    message
  };
}

export function unknownError(
  error: any
): UnknownError {
  return {
    errorKind: 'Unknown',
    error
  };
}

export function badInputError(
  message: string,
  suggestion?: string
): BadInputError {
  return {
    errorKind: 'BadInput',
    message,
    suggestion
  }
}
