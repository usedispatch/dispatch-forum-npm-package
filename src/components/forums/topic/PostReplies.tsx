import * as _ from "lodash";
import { useMemo } from "react";
import Jdenticon from "react-jdenticon";
import { ForumPost } from "@usedispatch/client";

import { Gift, Reply, Trash } from "../../../assets";
import { useForum } from "../../../contexts/DispatchProvider";
import { SCOPES, UserRoleType } from "../../../utils/permissions";
import { Votes } from "./Votes";
import { PermissionsGate } from "../../../components/common";
import { EditPost } from "./EditPost";

interface PostRepliesProps {
  userRole: UserRoleType;
  replies: ForumPost[];
  onDeletePost: (postToDelete: ForumPost) => Promise<void>;
  onUpVotePost: (post: ForumPost) => Promise<string>;
  onDownVotePost: (post: ForumPost) => Promise<string>;
  onReplyClick: () => void;
  onAwardReply: (post: ForumPost) => void;
}

export function PostReplies(props: PostRepliesProps) {
  const {
    onDeletePost,
    onReplyClick,
    onDownVotePost,
    onUpVotePost,
    onAwardReply,
  } = props;
  const Forum = useForum();
  const permission = Forum.permission;

  const postedAt = (reply: ForumPost) =>
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
    const index = replies.findIndex((r) => r.postId === replyToUpdate.postId);
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
        return (
          <div key={index}>
            {index > 0 && <div className="repliesDivider" />}
            <div className="replyContent">
              <div className="replyHeader">
                <div className="posterId">
                  <div className="icon">
                    <Jdenticon
                      value={reply?.poster.toBase58()}
                      alt="posterID"
                    />
                  </div>
                  <div className="walletId">{reply.poster.toBase58()}</div>
                </div>
                <div className="postedAt">{postedAt(reply)}</div>
              </div>
              <div className="replyBody">{reply?.data.body}</div>
              <div className="replyActionsContainer">
                <div className="leftBox">
                  <PermissionsGate scopes={[SCOPES.canCreateReply]}>
                    <Votes
                      updateVotes={(upVoted) => updateVotes(upVoted, reply)}
                      onUpVotePost={() => onUpVotePost(reply)}
                      onDownVotePost={() => onDownVotePost(reply)}
                      post={reply}
                    />
                  </PermissionsGate>
                </div>
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
                      Gift Award <Gift />
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
