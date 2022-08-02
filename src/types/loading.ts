

export type Loading<T>
  = Initial
  | Pending
  | Success<T>
  | Failed
  | NotFound;

export interface Success<T> {
  state: 'success';
  value: T;
};

export interface Initial { state: 'initial'; }
export interface Pending { state: 'pending'; }
export interface Failed { state: 'failed'; }
export interface NotFound { state: 'notFound'; }
