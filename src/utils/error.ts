import {
  NotFoundError,
  UncategorizedError,
  Result,
  DispatchError,
  BadInputError,
  ContractError
} from '../types/error';

export function errorSummary(error: DispatchError) {
  return `${error.errorKind}: ${error.message}`;
}

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

export function isNotFoundError(
  value: DispatchError
): value is NotFoundError {
  return value.errorKind === 'NotFound';
}

export function isContractError(
  value: DispatchError
): value is ContractError {
  return value.errorKind === 'Contract';
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
    message: JSON.stringify(error),
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
