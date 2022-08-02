

export type Loading<T>
  = Success<T>
  | Pending
  | Failed;

export interface Success<T> {
  state: 'success';
  value: T;
};

export interface Pending {
  state: 'pending';
}

export interface Failed {
  state: 'Failed';
}
