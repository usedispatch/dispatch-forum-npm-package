import isNil from 'lodash/isNil';
import { useState, ReactNode, SyntheticEvent } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ForumPost } from '@usedispatch/client';

import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Spinner,
  TransactionLink,
} from '../../common';
import { Notification } from '..';

import { useForum } from '../../../contexts/DispatchProvider';
import { NOTIFICATION_BANNER_TIMEOUT } from '../../../utils/consts';
import { errorSummary } from '../../../utils/error';
import { isSuccess } from '../../../utils/loading';
import { CreatedPost } from '../../../utils/hooks';

interface CreatePostProps {
  topic: ForumPost;
  collectionId: PublicKey;
  update: () => Promise<void>;
  addPost: (post: CreatedPost) => void;
  onReload: () => void;
  setPostInFlight: (postInFlight: boolean) => void;
}

export function CreatePost(props: CreatePostProps): JSX.Element {
  const {
    collectionId,
    topic,
    onReload,
    update,
    addPost,
    setPostInFlight,
  } = props;
  const Forum = useForum();
  const permission = Forum.permission;

  const [bodySize, setBodySize] = useState(0);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [newPost, setNewPost] = useState('');
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

  const createNewPost = async (event: SyntheticEvent): Promise<void> => {
    event.preventDefault();

    const post = { body: newPost };
    setPostInFlight(true);
    setAwaitingConfirmation(true);
    const tx = await Forum.createForumPost(post, topic.postId, collectionId);

    setAwaitingConfirmation(false);
    if (isSuccess(tx)) {
      const localPost: CreatedPost = {
        data: {
          body: post.body,
          ts: new Date(),
        },
        poster: Forum.wallet.publicKey,
        isTopic: false,
        replyTo: topic.address,
        state: 'created',
      };
      addPost(localPost);
      setNewPost('');

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
      }).then(async () => update());
      setTimeout(
        () => setNotification({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT,
      );
      onReload();
      setBodySize(0);
    } else {
      const error = tx;
      setPostInFlight(false);
      setNotification({ isHidden: true });
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The new post could not be created',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
    }
  };

  return (
    <>
      {!isNil(modalInfo) && (
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
            <form onSubmit={createNewPost}>
              <div className="formContainer">
                <textarea
                  className="postContent"
                  placeholder="Type your comment here"
                  required
                  value={newPost}
                  maxLength={800}
                  disabled={!permission.readAndWrite}
                  onChange={(event) => {
                    setNewPost(event.target.value);
                    setBodySize(
                      Buffer.from(event.target.value, 'utf-8').byteLength,
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
                    !permission.readAndWrite || bodySize > 800
                  }>
                  {awaitingConfirmation && <div className='loading'><Spinner /></div> }
                  Post
                </button>
              </div>
            </form>
        </div>
      </div>
    </>
  );
}
