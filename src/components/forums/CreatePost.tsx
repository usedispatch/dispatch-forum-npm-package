import { useState, ReactNode } from "react";
import * as web3 from "@solana/web3.js";

import { MessageType, PopUpModal, Spinner } from "components/common";

interface CreatePostProps {
  topicId: number;
  collectionId: web3.PublicKey;
  createForumPost: (
    post: {
      subj?: string | undefined;
      body: string;
      meta?: any;
    },
    topicId: number,
    collectionId: web3.PublicKey
  ) => Promise<void>;
  onReload: () => void;
}

export function CreatePost(props: CreatePostProps) {
  const { createForumPost, collectionId, topicId, onReload } = props;
  const [loading, setLoading] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
  } | null>(null);

  const createNewPost = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setLoading(true);
    const target = event.target as typeof event.target & {
      post: { value: string };
    };

    const post = { body: target.post.value };

    try {
      await createForumPost(post, topicId, collectionId);
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: "The new post was created",
      });
      setLoading(false);
      onReload();
    } catch (error) {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "The new post could not be created",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <PopUpModal
        id="create-topic-info"
        visible={modalInfo !== null}
        title={modalInfo?.title}
        messageType={modalInfo?.type}
        body={modalInfo?.body}
        okButton={
          <a
            className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white border-2"
            onClick={() => setModalInfo(null)}
          >
            OK
          </a>
        }
      />
      <div className="h-auto my-4 w-full">
        <div className="grid grid-flow-col gap-3">
          {loading ? (
            <div className="pb-8">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={createNewPost}>
              <div className="form-control ">
                <textarea
                  className="textarea textarea-bordered h-32 w-full border-gray-800 rounded-2xl"
                  required
                  maxLength={800}
                  name="post"
                />
              </div>
              <div className="flex justify-end pt-4 pb-8">
                <button
                  className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white px-10"
                  type="submit"
                >
                  Comment
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
