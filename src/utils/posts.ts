import {
  ForumPost
} from '@usedispatch/client';
import {
  ClientPost,
  EditedPost
} from '@types';
import {
  isForumPost,
  isEditedPost
} from './forumData';

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
   * A reply may only be made 'to' a ForumPost or an EditedPost,
   * because only ForumPosts exist on-chain
   */
  to: ForumPost | EditedPost
): ClientPost[] {
  return posts.filter((post) => {
    if ((isForumPost(to) || isEditedPost(to)) && post.replyTo) {
      return post.replyTo.equals(to.address);
    } else {
      return false;
    }
  })
}

export function sortByVotes(
  posts: ClientPost[],
): ClientPost[] {
  return posts.sort((left, right) => {
    // If left is not confirmed on-chain, it should be sorted first
    if (!isForumPost(left)) { return -1; }
    // If right is not confirmed on-chain, it should be sorted first
    if (!isForumPost(right)) { return 1; }
    const leftVotes = left.upVotes - left.downVotes;
    const rightVotes = right.upVotes - right.downVotes;
    return rightVotes - leftVotes;
  });
}
