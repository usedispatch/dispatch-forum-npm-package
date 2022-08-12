import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";
import * as web3 from "@solana/web3.js";

import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Spinner,
  TransactionLink,
} from "../../common";
import { Notification } from "..";
import { useForum } from "../../../contexts/DispatchProvider";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";

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
  ) => Promise<string | undefined>;
  update: () => Promise<void>;
  onReload: () => void;
}

export function CreatePost(props: CreatePostProps) {
  const { createForumPost, collectionId, topicId, onReload, update } = props;
  const Forum = useForum();
  const permission = Forum.permission;

  const [loading, setLoading] = useState(false);
  const [isNotificationHidden, setIsNotificationHidden] = useState(true);
  const [bodySize, setBodySize] = useState(0);
  const [notificationContent, setNotificationContent] = useState<{
    content: string | ReactNode;
    type: MessageType;
  }>();
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const createNewPost = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setLoading(true);
    const target = event.target as typeof event.target & {
      post: { value: string };
    };

    const post = { body: target.post.value };
    try {
      const tx = await createForumPost(post, topicId, collectionId);
      if (tx) {
        Forum.connection.confirmTransaction(tx).then(() => update());
      }
      setLoading(false);
      setIsNotificationHidden(false);
      setNotificationContent({
        content: (
          <>
            Post created successfully.
            <TransactionLink transaction={tx!} />
          </>
        ),
        type: MessageType.success,
      });
      setTimeout(
        () => setIsNotificationHidden(true),
        NOTIFICATION_BANNER_TIMEOUT
      );
      onReload();
      setBodySize(0);
    } catch (error: any) {
      const message = JSON.stringify(error);
      setLoading(false);
      if (error.code !== 4001) {
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: "The new post could not be created",
          collapsible: { header: "Error", content: message },
        });
      }
    }
  };

  return (
    <>
      {!_.isNil(modalInfo) && (
        <PopUpModal
          id="create-topic-info"
          visible
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={modalInfo.body}
          collapsible={modalInfo.collapsible}
          okButton={
            <a className="okButton" onClick={() => setModalInfo(null)}>
              OK
            </a>
          }
        />
      )}
      <Notification
        hidden={isNotificationHidden}
        content={notificationContent?.content}
        type={notificationContent?.type}
        onClose={() => setIsNotificationHidden(true)}
      />
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
                  onChange={(event) => {
                    setBodySize(
                      new Buffer(event.target.value, "utf-8").byteLength
                    );
                  }}
                  name="post"
                />
              </div>
              <div>{bodySize}/800</div>
              <div className="buttonContainer">
                <button
                  className="createPostButton"
                  type="submit"
                  disabled={!permission.readAndWrite || bodySize > 800}
                >
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
