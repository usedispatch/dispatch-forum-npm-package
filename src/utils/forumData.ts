import { ForumPost } from '@usedispatch/client';
import {
  ClientPost,
  EditedPost,
  CreatedPost
} from '../types/forumData';

// TODO(andrew) move all these intos a types util file
export function isForumPost(
  post: ClientPost
): post is ForumPost {
  // A post is a LocalPost if it has an associated parent object
  // TODO(andrew) confirm that this is the best field to check
  return !('state' in post);
}

export function isEditedPost(
  post: ClientPost
): post is EditedPost {
  // A post is an edited post if it's not a ForumPost, but it
  // does have an address
  return 'state' in post && post.state === 'edited';
}

export function isCreatedPost(
  post: ClientPost
): post is CreatedPost {
  // A post is a client post if it doesn't have the address field
  return 'state' in post && post.state === 'created';
}

