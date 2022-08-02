

export type Loading<T>
  = Initial
  | Pending
  | Success<T>
  | Failed;

export interface Success<T> {
  state: 'success';
  value: T;
};

export interface Initial { state: 'initial'; }
export interface Pending { state: 'pending'; }
export interface Failed { state: 'failed'; }
