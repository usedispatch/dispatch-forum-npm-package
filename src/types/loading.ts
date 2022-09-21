import { Result } from  './error';

/**
 * A tagged union representing the action of loading a `T`, which
 * may be in progress, succeed or fail. Note that you cannot nest
 * this type within itself or `LoadingResult`, or unintended
 * consequences will arise
 */
export type Loading<T>
  = Initial
  | Pending
  | Result<T>;

// The initial state when the page is loaded and before any data
// has been fetched
export interface Initial { loadingState: 'initial'; }
// An RPC request has been made and we are awaiting the response
export interface Pending { loadingState: 'pending'; }
