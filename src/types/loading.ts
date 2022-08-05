export type Loading<T>
  = Initial
  | Pending
  | Success<T>
  | DispatchClientError
  | OnChainAccountNotFound;

export type LoadingResult<T>
  = Success<T>
  | DispatchClientError
  | OnChainAccountNotFound;

export type Success<T> = T & { state: 'success' };

// The initial state when the page is loaded and before any data
// has been fetched
export interface Initial { state: 'initial'; }
// An RPC request has been made and we are awaiting the response
export interface Pending { state: 'pending'; }
// There was an error while accessing the RPC Node
export interface DispatchClientError {
  state: 'dispatchClientError';
  error?: any;
}
// The requested account did not exist on the blockchain
export interface OnChainAccountNotFound { state: 'onChainAccountNotFound'; }
