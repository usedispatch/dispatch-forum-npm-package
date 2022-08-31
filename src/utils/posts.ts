import {
  ForumPost
} from '@usedispatch/client';
import {
  LocalPost,
  isForumPost
} from '../utils/hooks';

export function selectTopics(
  posts: (ForumPost | LocalPost)[]
): (LocalPost | ForumPost)[] {
  return posts.filter(({ data }) => data.meta?.topic === true)
}

export function selectForumPosts(
  posts: (ForumPost | LocalPost)[]
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
  posts: (LocalPost | ForumPost)[],
  /**
   * A reply may only be made 'to' a ForumPost, because only
   * ForumPosts exist on-chain
   */
  to: ForumPost
): (LocalPost | ForumPost)[] {
  return posts.filter(({ replyTo }) => replyTo && replyTo.equals(to.address))
}

export function sortByVotes(
  posts: (ForumPost | LocalPost)[],
): (LocalPost | ForumPost)[] {
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
