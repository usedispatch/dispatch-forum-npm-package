export type ForumIdentifier<T> = ForumID | SolanartID | T;

export interface ForumID {
  forumID: string;
}

export interface SolanartID {
  solanartID: string;
}

export function isSolanartID(
  value: ForumIdentifier<ForumID | SolanartID>,
): value is SolanartID {
  return value.solanartID !== undefined;
}
