export type Result<T> = T | DispatchError;

export type DispatchError
  = WalletError
  | BadInputError
  | ContractError
  | RateLimitingError
  | NotFoundError
  | UnknownError;

/**
 * An error we caught from Phantom during transaction send
 */
export interface WalletError {
  errorKind: 'Wallet';
  message: string;
  suggestion?: string;
}

/**
 * For when user input or data fetched from the web is improperly
 * formatted
 */
export interface BadInputError {
  errorKind: 'BadInput';
  message: string;
  suggestion?: string;
}

/**
 * The on-chain data was not found
 */
export interface NotFoundError {
  errorKind: 'NotFound';
  message: string;
}

/**
 * An error thrown by one of our Contracts, due to something like
 * improper permissions or badly-formatted data
 */
export interface ContractError {
  errorKind: 'Contract';
  code: number;
  message: string;
  suggestion?: string;
}

/**
 * An error that indicates that we have exhausted the RPC node
 * and need to wait a few minutes
 */
export interface RateLimitingError {
  errorKind: 'RateLimiting';
  message: string;
  suggestion?: string;
}

/**
 * An unknown or uncategorized kind of error
 */
export interface UnknownError {
  errorKind: 'Unknown',
  error: any
}
