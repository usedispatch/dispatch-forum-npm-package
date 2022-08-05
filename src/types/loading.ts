/**
 * A tagged union representing the action of loading a `T`, which
 * may be in progress, succeed or fail. Note that you cannot nest
 * this type within itself or `LoadingResult`, or unintended
 * consequences will arise
 */
export type Loading<T>
  = Initial
  | Pending
  | T
  | DispatchClientError
  | OnChainAccountNotFound;

/**
 * A tagged union representing the result of loading a `T`, which
 * may succeed or fail. Note that you cannot nest this type
 * within itself or `Loading`, or unintended consequences will
 * arise
 */
export type LoadingResult<T>
  = T
  | DispatchClientError
  | OnChainAccountNotFound;

// The initial state when the page is loaded and before any data
// has been fetched
export interface Initial { loadingState: 'initial'; }
// An RPC request has been made and we are awaiting the response
export interface Pending { loadingState: 'pending'; }
// There was an error while accessing the RPC Node
export interface DispatchClientError {
  loadingState: 'dispatchClientError';
  error?: any;
}
// The requested account did not exist on the blockchain
export interface OnChainAccountNotFound { loadingState: 'onChainAccountNotFound'; }
