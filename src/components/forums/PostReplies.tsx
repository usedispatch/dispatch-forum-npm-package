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
  const Forum = useForum()
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
    <div className="font-raleway h-auto">
      {replies.map((reply, index) => {
        const deletePermission = publicKey
          ? publicKey.toBase58() === reply.poster.toBase58() ||
            userRole === UserRoleType.Moderator
          : false;

        return (
          <div key={index}>
            {index > 0 && <div className="border-t border-gray-400 " />}
            <div className=" my-6">
              <div className="flex items-start justify-between pb-4">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <div className="h-7 w-7 mr-1">
                      <Jdenticon
                        className="h-7 w-7"
                        value={reply?.poster.toBase58()}
                        alt="posterID"
                      />
                    </div>
                    <div className="text-sm font-normal">
                      {reply.poster.toBase58()}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-light">
                  Posted at: {postedAt(reply)}
                </div>
              </div>
              <div className="text-sm mb-3">{reply?.data.body}</div>
              <div className="flex items-center">
                {deletePermission && (
                  <button
                    className="mr-1"
                    onClick={() => onDeletePost(reply)}
                  >
                    <Trash/>
                  </button>
                )}
                <button
                  className="normal-case border border-gray-800 rounded-full text-xs flex items-center h-6 max-h-6 p-2 mr-2"
                  onClick={onReplyClick}
                >
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
