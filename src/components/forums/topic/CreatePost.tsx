import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";
import { LocalPost } from "../../../utils/hooks";

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
  topic: ForumPost;
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
  addPost: (post: LocalPost) => void;
  onReload: () => void;
  postInFlight: boolean;
  setPostInFlight: (postInFlight: boolean) => void;
}

export function CreatePost(props: CreatePostProps) {
  const {
    createForumPost,
    collectionId,
    topic,
    onReload,
    update,
    addPost,
    postInFlight,
    setPostInFlight,
  } = props;
  const Forum = useForum();
  const permission = Forum.permission;

  const [loading, setLoading] = useState(false);
  const [bodySize, setBodySize] = useState(0);
  const [notification, setNotification] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });
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
      const tx = await createForumPost(post, topic.postId, collectionId);

      const localPost: LocalPost = {
        data: {
          body: post.body,
          ts: new Date(),
        },
        poster: Forum.wallet.publicKey!,
        isTopic: false,
        replyTo: topic.address,
      };
      addPost(localPost);

      setLoading(false);
      setNotification({
        isHidden: false,
        content: (
          <>
            Creating new post.
            <TransactionLink transaction={tx!} />
          </>
        ),
        type: MessageType.info,
      });

      if (tx) {
        await Forum.connection.confirmTransaction(tx).then(() => {
          setPostInFlight(false);
          setNotification({
            isHidden: false,
            content: (
              <>
                Post created successfully.
                <TransactionLink transaction={tx} />
              </>
            ),
            type: MessageType.success,
          });
          update();
        });
        setTimeout(
          () => setNotification({ isHidden: true }),
          NOTIFICATION_BANNER_TIMEOUT
        );
      }
      onReload();
      setBodySize(0);
    } catch (error: any) {
      setPostInFlight(false);
      setNotification({ isHidden: true });
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
        hidden={notification.isHidden}
        content={notification?.content}
        type={notification?.type}
        onClose={() => setNotification({ isHidden: true })}
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
                  maxLength={800}
                  disabled={!permission.readAndWrite || postInFlight}
                  onChange={(event) => {
                    setBodySize(
                      new Buffer(event.target.value, "utf-8").byteLength
                    );
                  }}
                  name="post"
                />
              </div>
              <div className="textSize">{bodySize}/800</div>
              <div className="buttonContainer">
                <button
                  className="createPostButton"
                  type="submit"
                  disabled={
                    !permission.readAndWrite || bodySize > 800 || postInFlight
                  }>
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
