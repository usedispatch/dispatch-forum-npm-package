import * as _ from "lodash";
import Markdown from "markdown-to-jsx";
import { useMemo } from "react";
import { PublicKey } from '@solana/web3.js'
import Jdenticon from "react-jdenticon";
import { ForumPost } from "@usedispatch/client";

import { Gift, Info, Reply, Trash } from "../../../assets";
import { PermissionsGate, Spinner } from "../../../components/common";
import { EditPost, RoleLabel, Votes } from "../index";

import { useForum } from "../../../contexts/DispatchProvider";
import { SCOPES, UserRoleType } from "../../../utils/permissions";
import {
  ForumData,
  isForumPost,
  isCreatedPost,
  CreatedPost,
  ClientPost
} from "../../../utils/hooks";

interface PostRepliesProps {
  forumData: ForumData;
  participatingModerators: PublicKey[] | null;
  userRole: UserRoleType;
  replies: ClientPost[];
  topicOwnerId: PublicKey;
  update: () => Promise<void>;
  editPost: (post: ForumPost, newText: string) => void;
  onDeletePost: (postToDelete: ForumPost) => Promise<void>;
  onUpVotePost: (post: ForumPost) => Promise<string>;
  onDownVotePost: (post: ForumPost) => Promise<string>;
  onReplyClick: () => void;
  onAwardReply: (post: ForumPost) => void;
}

export function PostReplies(props: PostRepliesProps) {
  const {
    forumData,
    participatingModerators,
    topicOwnerId,
    onDeletePost,
    onReplyClick,
    onDownVotePost,
    onUpVotePost,
    onAwardReply,
    update,
    editPost
  } = props;
  const forum = useForum();
  const permission = forum.permission;

  const postedAt = (reply: ClientPost) =>
    `${reply.data.ts.toLocaleDateString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })} at ${reply.data.ts.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "numeric",
    })}`;

  const replies = useMemo(
    () =>
      props.replies.sort((a, b) => b.data.ts.valueOf() - a.data.ts.valueOf()),
    [props.replies]
  );

  const updateVotes = (upVoted: boolean, replyToUpdate: ForumPost) => {
    const index = replies.findIndex((r) => {
      return "postId" in r && r.postId === replyToUpdate.postId;
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
    return null;
  }

  return (
    <div className="repliesContainer">
      {replies.map((reply, index) => {
        const isPost = isForumPost(reply);

        return (
          <div key={index}>
            <div className={`replyContent  ${!isPost ? "inFlight" : ""}`}>
              <div className="replyHeader">
                <div className="posterId">
                  <div className="icon">
                    <Jdenticon value={reply.poster.toBase58()} alt="posterID" />
                  </div>
                  <div className="walletId">
                    {reply.poster.toBase58()}
                    <RoleLabel
                      topicOwnerId={topicOwnerId}
                      posterId={reply.poster}
                      moderators={participatingModerators}
                    />
                  </div>
                </div>
                <div className="postedAt">
                  {isPost ? (
                    <>
                      {postedAt(reply)}
                      {/* Only show Address link if post is confirmed */}
                      <div className="accountInfo">
                        <a
                          href={`https://solscan.io/account/${reply.address}?cluster=${forum.cluster}`}
                          className="transactionLink"
                          target="_blank">
                          <Info />
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      Posting
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
                        onUpVotePost={() => onUpVotePost(reply)}
                        onDownVotePost={() => onDownVotePost(reply)}
                        post={reply}
                      />
                    </PermissionsGate>
                  )}
                  {/* Only show edit dialog if post is confirmed */}
                  {isForumPost(reply) && (
                    <EditPost
                      post={reply}
                      forumData={forumData}
                      update={() => update()}
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
                        onClick={() => onDeletePost(reply)}>
                        <Trash />
                      </button>
                      <div className="actionDivider" />
                    </PermissionsGate>
                    <PermissionsGate scopes={[SCOPES.canCreateReply]}>
                      <button
                        className="awardButton"
                        disabled={!permission.readAndWrite}
                        onClick={() => onAwardReply(reply)}>
                        <Gift /> Send Token
                      </button>
                      <div className="actionDivider" />
                      <button
                        className="replyButton"
                        onClick={onReplyClick}
                        disabled={!permission.readAndWrite}>
                        Reply <Reply />
                      </button>
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
