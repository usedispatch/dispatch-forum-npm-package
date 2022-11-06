import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { DispatchConnection, Forum, ForumPost } from '@usedispatch/client';

import { NewsFeed, NewsPost, PostContent } from '../../forums';
import { DispatchForum } from '../../../utils/postbox/postboxWrapper';
import { UserRoleType } from '../../../utils/permissions';
import { ForumData, CreatedPost } from '../../../utils/hooks';
import { selectRepliesFromPosts } from '../../../utils/posts';

interface NewsPostListProps {
  forum: DispatchForum;
  forumData: ForumData;
  participatingModerators: PublicKey[] | null;
  userRoles: UserRoleType[];
  update: () => Promise<void>;
  addPost: (post: CreatedPost) => void;
  editPost: (post: ForumPost, newText: string) => void;
  deletePost: (post: ForumPost) => void;
  topic: ForumPost;
  onDeletePost: (tx: string) => Promise<void>;
  postInFlight: boolean;
  setPostInFlight: (postInFlight: boolean) => void;
  userIsMod: boolean;
  newsposts: NewsFeed;
}

export type NewsPostAsForumPost = ForumPost & NewsPost;

export default function NewsPostList(props: NewsPostListProps): JSX.Element {
  const {
    forumData,
    forum,
    userRoles,
    onDeletePost,
    topic,
    update,
    editPost,
    addPost,
    deletePost,
    postInFlight,
    setPostInFlight,
    participatingModerators,
    userIsMod,
    newsposts,
  } = props;

  const posts = useMemo(() => {
    const posts = selectRepliesFromPosts(forumData.posts, topic);
    // return sortByVotes(posts);
    return posts;
  }, [forumData]);

  const newsPagePostAsClientPost = newsposts.posts.map((post) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
      forum: new Forum(new DispatchConnection(forum.connection, forum.wallet), new PublicKey('2offuiAEPGBZRk5iNs6ocr6jVaAN6VLZDXa9kaDLhahS')),
      isTopic: false,
      parent: topic,
      address: new PublicKey(post.post_id),
      postId: 10,
      poster: new PublicKey(post.post_id),
      data: {
        body: post.content.length > 800 ? post.content.substring(0, 500) + '...' : post.content,
        ts: new Date(post.created_at),
      },
      upVotes: 0,
      downVotes: 0,
      settings: [],
      ...post,
    } as NewsPostAsForumPost;
  });

  const feedPosts = [...posts, ...newsPagePostAsClientPost];
  const emptyList = (
    <div className="emptyPostsList">
      <div className="text">The topic has no comments</div>
    </div>
  );

  return (
    <div className="postListContainer">
      {feedPosts.length === 0
        ? emptyList
        : feedPosts.map((post) => {
          return (
              // HACK: Use the timestring for key value here because the postId and address may not be present on `LocalPost`s
              <div key={`post_${post.data.body}`}>
                <PostContent
                  forum={forum}
                  forumData={forumData}
                  post={post}
                  userRoles={userRoles}
                  topicPosterId={topic.poster}
                  onDeletePost={onDeletePost}
                  update={update}
                  participatingModerators={participatingModerators}
                  addPost={addPost}
                  editPost={editPost}
                  deletePost={deletePost}
                  postInFlight={postInFlight}
                  setPostInFlight={setPostInFlight}
                  userIsMod={userIsMod}
                />
              </div>
          );
        })}
    </div>
  );
}
