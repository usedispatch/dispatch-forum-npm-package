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
import { AddGIF } from '../../../components/common/AddGIF';
import { DispatchError } from '../../../types/error';

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

  const [showGIFModal, setShowGIFModal] = useState(false);
  const [bodySize, setBodySize] = useState(0);
  const [bodyContent, setBodyContent] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
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

  const onGifSelect = (gifURL: string): void => {
    setBodyContent(bodyContent.concat(`\n ![](${gifURL}) \n`));
    setShowGIFModal(false);
  };

  const createNewPost = async (event: SyntheticEvent): Promise<void> => {
    event.preventDefault();

    const post = { body: bodyContent };
    setPostInFlight(true);
    setAwaitingConfirmation(true);
    const tx = await Forum.createForumPost(post, topic.postId, collectionId);
    setAwaitingConfirmation(false);
    setBodyContent('');

    if (isSuccess(tx) && isSuccess(Forum.wallet)) {
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
        collapsible: { header: 'Error', content: errorSummary(error as DispatchError) },
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
      {showGIFModal && (
        <PopUpModal
          id="add-gif-modal"
          visible
          title="Add GIF"
          body={<AddGIF onGifSelect={onGifSelect} />}
          onClose={() => setShowGIFModal(false)}
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
            <div>
              <div className="formContainer">
                <textarea
                  className="postContent"
                  placeholder="Type your comment here. We support markdown!"
                  maxLength={800}
                  disabled={!permission.readAndWrite}
                  value={bodyContent}
                  onChange={event => {
                    setBodySize(
                      Buffer.from(event.target.value, 'utf-8').byteLength,
                    );
                    setBodyContent(event.target.value);
                  }}
                  name="post"
                />
              </div>
              <div className="textSize">{bodySize}/800</div>
              <div className="buttonContainer">
                <button
                  className="addGIFButton"
                  disabled={!permission.readAndWrite}
                  onClick={() => {
                    setShowGIFModal(true);
                  }}>
                  <span>GIF</span>
                </button>
                <button
                  className="createPostButton"
                  type="submit"
                  disabled={!permission.readAndWrite || bodySize > 800}
                  onClick={async (e) => {
                    if (bodyContent.length > 0) {
                      await createNewPost(e);
                    }
                  }}>
                  {awaitingConfirmation && (
                    <div className='loading'>
                      <Spinner />
                      </div>
                  )}
                  Post
                </button>
              </div>
            </div>
        </div>
      </div>
    </>
  );
}
