import * as _ from "lodash";
import Jdenticon from "react-jdenticon";
import { ForumPost } from "@usedispatch/client";

import { Trash } from "../../assets";
import { UserRoleType } from "../../utils/postbox/userRole";
import { useForum } from "../../contexts/DispatchProvider";

interface PostRepliesProps {
  userRole: UserRoleType;
  replies: ForumPost[];
  onDeletePost: (post: ForumPost) => Promise<string>;
  onReplyClick: () => void;
}

export function PostReplies(props: PostRepliesProps) {
  const { replies, userRole, onDeletePost, onReplyClick } = props;
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
                    <div className="walletId">{reply.poster.toBase58()}</div>
                  </div>
                </div>
                <div className="postedAt">Posted at: {postedAt(reply)}</div>
              </div>
              <div className="replyBody">{reply?.data.body}</div>
              <div className="replyActionsContainer">
                {deletePermission && (
                  <button
                    className="deleteButton"
                    onClick={() => onDeletePost(reply)}>
                    <Trash />
                  </button>
                )}
                <button className="replyButton" onClick={onReplyClick}>
                  Reply
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
