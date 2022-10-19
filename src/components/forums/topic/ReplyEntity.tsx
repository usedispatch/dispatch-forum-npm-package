import { useEffect, useRef } from 'react';
import Jdenticon from 'react-jdenticon';
import Markdown from 'markdown-to-jsx';
import { PublicKey } from '@solana/web3.js';
import { ForumPost } from '@usedispatch/client';

import { useForum } from '../../../contexts/DispatchProvider';
import { Gift, Trash } from '../../../assets';
import { AccountInfoLink, PermissionsGate, Spinner } from '../../../components/common';
import {
  EditPost, RoleLabel, Votes, SharePost,
} from '../index';
import { ClientPost, isForumPost, ForumData } from '../../../utils/hooks';
import { getIdentity } from '../../../utils/identity';
import { SCOPES } from '../../../utils/permissions';
import { Result } from '../../../types/error';
import { isNil } from 'lodash';

type ReplyEntityProps = {
  reply: ClientPost;
  topicOwnerId: PublicKey;
  participatingModerators: PublicKey[] | null;
  forumData: ForumData;
  update: () => Promise<void>;
  updateVotes: (upVoted: boolean, replyToUpdate: ForumPost) => void;
  onUpVotePost: (post: ForumPost) => Promise<Result<string>>;
  onDownVotePost: (post: ForumPost) => Promise<Result<string>>;
  editPost: (post: ForumPost, newText: string) => void;
  onAwardReply: (post: ForumPost) => void;
  onDeletePost: (postToDelete: ForumPost) => Promise<void>;
};

const ReplyEntity = ({
  reply,
  topicOwnerId,
  participatingModerators,
  forumData,
  update,
  updateVotes,
  onUpVotePost,
  onDownVotePost,
  editPost,
  onAwardReply,
  onDeletePost,
}: ReplyEntityProps) => {
  const forum = useForum();
  const replyContainer = useRef<null | HTMLDivElement>(null);

  const permission = forum.permission;
  const isPost = isForumPost(reply);
  const posterIdentity = getIdentity(reply.poster);

  const postedAt = (reply: ClientPost): string =>
    `${reply.data.ts.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })} at ${reply.data.ts.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: 'numeric',
    })}`;

  useEffect(() => {
    const { location: { hash } } = window;
    if (!isNil(replyContainer.current) && isPost && hash && hash.split('#')[1] === reply.address.toBase58()) {
      replyContainer.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replyContainer]);

  return (
      <div className={`replyContent  ${!isPost ? 'inFlight' : ''}`}>
        <div className="replyHeader">
          <div className="posterId" ref={replyContainer}>
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
              {isPost && (
                <>
                  <div className="actionDivider" />
                  <SharePost postAddress={reply.address.toBase58()} />
                </>
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
    );
};

export { ReplyEntity };
