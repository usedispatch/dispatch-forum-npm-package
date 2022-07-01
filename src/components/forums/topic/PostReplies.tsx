import * as _ from "lodash";
import { useMemo } from "react";
import Jdenticon from "react-jdenticon";
import { ForumPost } from "@usedispatch/client";

import { Trash } from "../../../assets";
import { UserRoleType } from "../../../utils/postbox/userRole";
import permission from "../../../utils/postbox/permission.json";
import { useForum } from "../../../contexts/DispatchProvider";

import { Votes } from "./Votes";

interface PostRepliesProps {
  userRole: UserRoleType;
  replies: ForumPost[];
  onDeletePost: (post: ForumPost) => Promise<string>;
  onUpVotePost: (post: ForumPost) => Promise<string>;
  onDownVotePost: (post: ForumPost) => Promise<string>;
  onReplyClick: () => void;
}

export function PostReplies(props: PostRepliesProps) {
  const { userRole, onDeletePost, onReplyClick, onDownVotePost, onUpVotePost } =
    props;
  const Forum = useForum();
  const { publicKey } = Forum.wallet;

  const postedAt = (reply: ForumPost) =>
    `${reply.data.ts.toLocaleDateString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })} at ${reply.data.ts.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "numeric",
    })}`;

  const replies = useMemo(() => props.replies, [props.replies]);

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
        const deletePermission = publicKey
          ? publicKey.toBase58() === reply.poster.toBase58() ||
            userRole === UserRoleType.Moderator
          : false;

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
                <div className="postedAt">Posted at: {postedAt(reply)}</div>
              </div>
              <div className="replyBody">{reply?.data.body}</div>
              <div className="replyActionsContainer">
                {deletePermission && (
                  <button
                    className="deleteButton"
                    disabled={!permission.readAndWrite}
                    onClick={() => onDeletePost(reply)}>
                    <Trash />
                  </button>
                )}
                <button
                  className="replyButton"
                  onClick={onReplyClick}
                  disabled={!permission.readAndWrite}>
                  Reply
                </button>
                <Votes
                  updateVotes={(upVoted) => updateVotes(upVoted, reply)}
                  onUpVotePost={() => onUpVotePost(reply)}
                  onDownVotePost={() => onDownVotePost(reply)}
                  post={reply}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
