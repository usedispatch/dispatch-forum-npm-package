import { useState, useContext, ReactNode } from "react";
import * as web3 from "@solana/web3.js";

import { MessageType, PopUpModal, Spinner } from "../../common";
// import permission from "../../../utils/postbox/permission.json";
import { ForumContext } from "../../../contexts/DispatchProvider";

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
  const Forum = useContext(ForumContext);
  const permission = Forum.permission;
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
      {modalInfo !== null && (
        <PopUpModal
          id="create-topic-info"
          visible
          title={modalInfo?.title}
          messageType={modalInfo?.type}
          body={modalInfo?.body}
          okButton={
            <a className="okButton" onClick={() => setModalInfo(null)}>
              OK
            </a>
          }
        />
      )}
      <div className="createPostContainer">
        <div className="createPostContent">
          {loading ? (
            <div className="spinnerContainer">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={createNewPost}>
              <div className="formContainer">
                <textarea
                  className="postContent"
                  placeholder="Type your comment here"
                  required
                  disabled={!permission.readAndWrite}
                  maxLength={800}
                  name="post"
                />
              </div>
              <div className="buttonContainer">
                <button
                  className="createPostButton"
                  type="submit"
                  disabled={!permission.readAndWrite}>
                  Post
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
