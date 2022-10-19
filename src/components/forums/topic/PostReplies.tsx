import { useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ForumPost } from '@usedispatch/client';

import { UserRoleType } from '../../../utils/permissions';
import { ForumData, ClientPost } from '../../../utils/hooks';
import { sortByVotes } from '../../../utils/posts';
import { Result } from '../../../types/error';
import { ReplyEntity } from './ReplyEntity';

interface PostRepliesProps {
  forumData: ForumData;
  participatingModerators: PublicKey[] | null;
  userRoles: UserRoleType[];
  replies: ClientPost[];
  topicOwnerId: PublicKey;
  update: () => Promise<void>;
  editPost: (post: ForumPost, newText: string) => void;
  onDeletePost: (postToDelete: ForumPost) => Promise<void>;
  onUpVotePost: (post: ForumPost) => Promise<Result<string>>;
  onDownVotePost: (post: ForumPost) => Promise<Result<string>>;
  onAwardReply: (post: ForumPost) => void;
}

export function PostReplies(props: PostRepliesProps): JSX.Element {
  const {
    forumData,
    participatingModerators,
    topicOwnerId,
    onDeletePost,
    onDownVotePost,
    onUpVotePost,
    onAwardReply,
    update,
    editPost,
  } = props;

  const replies = useMemo(
    () => { return sortByVotes(props.replies); },
    [props.replies],
  );

  const updateVotes = (upVoted: boolean, replyToUpdate: ForumPost): void => {
    const index = replies.findIndex((r) => {
      return 'postId' in r && r.postId === replyToUpdate.postId;
    });
    if (upVoted) {
      replyToUpdate.upVotes = replyToUpdate.upVotes + 1;
      replies[index] = replyToUpdate;
    } else {
      replyToUpdate.downVotes = replyToUpdate.downVotes + 1;
      replies[index] = replyToUpdate;
    }
  };

  if (replies.length === 0) {
    return <></>;
  }

  return (
    <div className="repliesContainer">
      {replies.map((reply, index) => (
        <ReplyEntity
          key={index}
          reply={reply}
          updateVotes={updateVotes}
          topicOwnerId={topicOwnerId}
          participatingModerators={participatingModerators}
          forumData={forumData}
          update={update}
          onUpVotePost={onUpVotePost}
          onDownVotePost={onDownVotePost}
          editPost={editPost}
          onAwardReply={onAwardReply}
          onDeletePost={onDeletePost}
        />
      ))}
    </div>
  );
}
