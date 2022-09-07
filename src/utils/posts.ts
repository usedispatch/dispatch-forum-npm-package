import {
  ForumPost
} from '@usedispatch/client';
import {
  CreatedPost,
  ClientPost,
  isForumPost
} from '../utils/hooks';

export function selectTopics(
  posts: ClientPost[]
): ClientPost[] {
  return posts.filter(({ data }) => data.meta?.topic === true)
}

export function selectForumPosts(
  posts: ClientPost[]
): ForumPost[] {
  const forumPosts = posts.filter(post => isForumPost(post));
  // We know that the filter line above leaves only ForumPosts
  // remaining. However TypeScript does not recognize that.
  // Therefore we cast here.
  return forumPosts as ForumPost[];
}

/**
 * Given a set of posts, return the ones that are replies
 */
export function selectRepliesFromPosts(
  posts: ClientPost[],
  /**
   * A reply may only be made 'to' a ForumPost, because only
   * ForumPosts exist on-chain
   */
  to: ForumPost
): ClientPost[] {
  return posts.filter(({ replyTo }) => replyTo && replyTo.equals(to.address))
}

export function sortByVotes(
  posts: ClientPost[],
): ClientPost[] {
  return posts.sort((left, right) => {
    // If left is a LocalPost, it should be sorted first
    if (!('upVotes' in left)) { return -1; }
    // If right is a LocalPost, it should be sorted last
    if (!('upVotes' in right)) { return 1; }
    const leftVotes = left.upVotes - left.downVotes;
    const rightVotes = right.upVotes - right.downVotes;
    return rightVotes - leftVotes;
  });
}
