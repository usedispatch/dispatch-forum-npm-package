import Markdown from 'markdown-to-jsx';
import { useMemo } from 'react';
import Jdenticon from 'react-jdenticon';
import { PublicKey } from '@solana/web3.js';
import { ForumPost } from '@usedispatch/client';

import { Gift, Trash } from '../../../assets';
import { AccountInfoLink, PermissionsGate, Spinner } from '../../../components/common';
import { EditPost, RoleLabel, Votes } from '../index';

import { useForum } from '../../../contexts/DispatchProvider';
import { SCOPES, UserRoleType } from '../../../utils/permissions';
import { ForumData, isForumPost, ClientPost } from '../../../utils/hooks';
import { getIdentity } from '../../../utils/identity';
import { sortByVotes } from '../../../utils/posts';
import { Result } from '../../../types/error';

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
  const forum = useForum();
  const permission = forum.permission;

  const postedAt = (reply: ClientPost): string =>
    `${reply.data.ts.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })} at ${reply.data.ts.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: 'numeric',
    })}`;

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
      {replies.map((reply, index) => {
        const isPost = isForumPost(reply);

        const posterIdentity = getIdentity(reply.poster);

        return (
          <div key={index}>
            <div className={`replyContent  ${!isPost ? 'inFlight' : ''}`}>
              <div className="replyHeader">
                <div className="posterId">
                  <div className="icon">
                    {(posterIdentity != null)
                      ? (
                      <img
                        src={posterIdentity.profilePicture.href}
                        style={{ borderRadius: '50%' }}
                      />
                      )
                      : (
                      <Jdenticon
                        value={reply.poster.toBase58()}
                        alt="posterID"
                      />
                      )}
                  </div>
                  <div className="walletId">
                    {(posterIdentity != null)
                      ? posterIdentity.displayName
                      : reply.poster.toBase58()}
                  </div>
                  <RoleLabel
                    topicOwnerId={topicOwnerId}
                    posterId={reply.poster}
                    moderators={participatingModerators}
                  />
                </div>
                <div className="postedAt">
                  {isPost
                    ? (
                    <>
                      {postedAt(reply)}
                      {/* Only show Address link if post is confirmed */}
                      <AccountInfoLink href={`https://solscan.io/account/${reply.address.toBase58()}?cluster=${forum.cluster}`} />
                    </>
                    )
                    : (
                    <>
                      Confirming on chain
                      <div className="posting">
                        <Spinner />
                      </div>
                    </>
                    )}
                </div>
              </div>
              <div className="replyBody">
                <Markdown>{reply?.data.body}</Markdown>
              </div>
              <div className="replyActionsContainer">
                <div className="leftBox">
                  {/* Only show votes if post is confirmed */}
                  {isForumPost(reply) && (
                    <PermissionsGate scopes={[SCOPES.canVote]}>
                      <Votes
                        forumData={forumData}
                        update={update}
                        updateVotes={(upVoted) => updateVotes(upVoted, reply)}
                        onUpVotePost={async () => onUpVotePost(reply)}
                        onDownVotePost={async () => onDownVotePost(reply)}
                        post={reply}
                      />
                    </PermissionsGate>
                  )}
                  {/* Only show edit dialog if post is confirmed */}
                  {isForumPost(reply) && (
                    <EditPost
                      post={reply}
                      forumData={forumData}
                      update={async () => update()}
                      editPostLocal={editPost}
                      showDividers={{ leftDivider: true, rightDivider: false }}
                    />
                  )}
                </div>
                {/* Only show delete, reply, and award if post is confirmed */}
                {isForumPost(reply) && (
                  <div className="rightBox">
                    <PermissionsGate
                      scopes={[SCOPES.canDeleteReply]}
                      posterKey={reply.poster}>
                      <button
                        className="deleteButton"
                        disabled={!permission.readAndWrite}
                        onClick={async () => onDeletePost(reply)}>
                        <Trash />
                      </button>
                    </PermissionsGate>
                    <PermissionsGate scopes={[SCOPES.canCreateReply]}>
                      {!(forum.wallet.publicKey?.equals(reply.poster) as boolean) && (
                        <>
                          <div className="actionDivider" />
                          <button
                            className="awardButton"
                            disabled={!permission.readAndWrite}
                            onClick={() => onAwardReply(reply)}>
                            <span>Send Token</span>
                            <Gift />
                          </button>
                        </>
                      )}
                    </PermissionsGate>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
