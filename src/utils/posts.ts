import {
  ForumPost
} from '@usedispatch/client';

/*
 * Given a set of posts, return the ones that are replies
 */
export function selectReplies(posts: ForumPost[], to: ForumPost) {
  return posts.filter(({ replyTo }) => replyTo && replyTo.equals(to.address))
}

