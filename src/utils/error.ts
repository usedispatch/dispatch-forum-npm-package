import {
  NotFoundError,
  UncategorizedError,
  Result,
  DispatchError,
  BadInputError
} from '../types/error';

export function isError<T>(
  value: Result<T>
): value is DispatchError {
  return 'errorKind' in value;
}

export function isUncategorizedError(
  value: DispatchError
): value is UncategorizedError {
  return value.errorKind === 'Uncategorized';
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

export function uncategorizedError(
  error: any
): UncategorizedError {
  return {
    errorKind: 'Uncategorized',
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
