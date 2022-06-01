import * as _ from "lodash";
import { ReactNode, useEffect, useState } from "react";
import Jdenticon from "react-jdenticon";
import Image from "next/image";
import * as web3 from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { ForumPost } from "@usedispatch/client";

import { trash } from "assets";
import { PopUpModal, Spinner } from "components/common";

interface PostRepliesProps {
  post: ForumPost;
  replies: ForumPost[];
  loading: boolean;
}

export function PostReplies(props: PostRepliesProps) {
  const { post, loading, replies } = props;

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
    <>
      <PopUpModal
        id="reply-delete-confirmation"
        visible={false}
        title="Are you sure you want to delete this post?"
        body={
          true ? (
            <div className="flex items-center justify-center pt-6 m-auto">
              <Spinner />
            </div>
          ) : (
            "This is permanent and you won’t be able to retrieve this comment again. Upvotes and downvotes will go too."
          )
        }
        okButton={
          !false && (
            <a
              className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white border-2"
              onClick={() => console.log("accept")}
            >
              Accept
            </a>
          )
        }
        cancelButton={
          !false && (
            <div
              className="btn btn-secondary border-2 hover:opacity-75 hover:bg-gray-200"
              onClick={() => console.log("cancel")}
            >
              Cancel
            </div>
          )
        }
      />
      {loading ? (
        <Spinner />
      ) : (
        <div className="font-raleway h-auto">
          {replies.map((reply, index) => {
            return (
              <>
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
                  {/* TODO(Ana) */}
                  <div className="flex items-center">
                    <button
                      className="border border-gray-800 rounded-full flex items-center w-8 h-6 max-h-6 p-2 mr-2"
                      onClick={() => console.log("delete comment")}
                    >
                      <Image src={trash} height={18} width={18} alt="delete" />
                    </button>
                    <button
                      className="normal-case border border-gray-800 rounded-full text-xs flex items-center h-6 max-h-6 p-2 mr-2"
                      onClick={() => console.log("reply to comment")}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </>
            );
          })}
        </div>
      )}
    </>
  );
}
