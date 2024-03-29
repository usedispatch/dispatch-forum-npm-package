import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Spinner,
  TransactionLink,
} from '../../common';
import { ReactNode, useEffect, useState } from 'react';

import { ForumData } from '../../../utils/hooks';
import { ForumPost } from '@usedispatch/client';
import { NOTIFICATION_BANNER_TIMEOUT } from '../../../utils/consts';
import { Notification } from '../Notification';
import { Result } from '../../../types/error';
import { Vote } from '../../../assets';
import { errorSummary } from '../../../utils/error';
import isNil from 'lodash/isNil';
import { isSuccess } from '../../../utils/loading';
import { useForum } from '../../../contexts/DispatchProvider';

interface VotesProps {
  post: ForumPost;
  forumData: ForumData;
  update: () => Promise<void>;
  onUpVotePost: () => Promise<Result<string>>;
  onDownVotePost: () => Promise<Result<string>>;
  updateVotes: (upVoted: boolean) => void;
  direction?: 'vertical' | 'horizontal';
}

export function Votes(props: VotesProps): JSX.Element {
  const Forum = useForum();
  const permission = Forum.permission;
  const { post, onDownVotePost, onUpVotePost, updateVotes, forumData, direction = 'horizontal' } = props;

  const [isNotificationHidden, setIsNotificationHidden] = useState(true);
  const [notificationContent, setNotificationContent] = useState<{
    content: string | ReactNode;
    type: MessageType;
  }>();

  const [loading, setLoading] = useState(false);
  const [alreadyUpVoted, setAlreadyUpVoted] = useState(false);
  const [alreadyDownVoted, setAlreadyDownVoted] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const setVotes = async (): Promise<void> => {
    if (isSuccess(forumData.votes)) {
      const vote = forumData.votes.find((v) => v.postId === post.postId);
      // redundancy needed for wallet change case and
      // either upvote or downvote previously set to true

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (vote?.upVote) {
        setAlreadyUpVoted(true);
        setAlreadyDownVoted(false);
      } else if (vote?.upVote === false) {
        setAlreadyDownVoted(true);
        setAlreadyUpVoted(false);
      }
    }
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    setVotes();
  }, [forumData.votes]);

  const upVotePost = async (): Promise<void> => {
    setLoading(true);

    const tx = await onUpVotePost();

    if (isSuccess(tx)) {
      updateVotes(true);
      setAlreadyUpVoted(true);
      setAlreadyDownVoted(false);
      setLoading(false);
      setIsNotificationHidden(false);
      setNotificationContent({
        content: (
          <>
            You voted!
            <TransactionLink transaction={tx} />
          </>
        ),
        type: MessageType.success,
      });
      setTimeout(
        () => setIsNotificationHidden(true),
        NOTIFICATION_BANNER_TIMEOUT,
      );
    } else {
      const error = tx;
      console.log('dsp', error);
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The post could not be up voted',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
      setLoading(false);
    }
  };

  const downVotePost = async (event: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    setLoading(true);

    const tx = await onDownVotePost();
    if (isSuccess(tx)) {
      updateVotes(false);
      setAlreadyDownVoted(true);
      setAlreadyUpVoted(false);
      setIsNotificationHidden(false);
      setNotificationContent({
        content: (
          <>
            You voted!
            <TransactionLink transaction={tx} />
          </>
        ),
        type: MessageType.success,
      });
      setTimeout(
        () => setIsNotificationHidden(true),
        NOTIFICATION_BANNER_TIMEOUT,
      );
      setLoading(false);
    } else {
      const error = tx;
      console.log('dsp', error);
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The post could not be down voted.',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });

      setLoading(false);
    }
  };

  return (
    <>
      {!isNil(modalInfo) && (
        <PopUpModal
          id="vote-info"
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
          onClose={() => setModalInfo(null)}
        />
      )}
      <div className="votePostContainer">
        <Notification
          hidden={isNotificationHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setIsNotificationHidden(true)}
        />
        { direction === 'horizontal'
          ? <div className="votePostContent">
              <button
                className={`votePostButton upVote ${alreadyUpVoted ? 'alreadyVoted' : ''}`}
                disabled={alreadyUpVoted || !permission.readAndWrite}
                onClick={upVotePost}>
                <Vote isUpVote />
              </button>
              <button
                className={`votePostButton downVote ${alreadyDownVoted ? 'alreadyVoted' : ''}`}
                disabled={alreadyDownVoted || !permission.readAndWrite}
                onClick={downVotePost}>
                <Vote />
              </button>
              {loading
                ? (
                <div className="spinnerContainer">
                  <Spinner />
                </div>
                )
                : (
                <div className="currentVotes">{post.upVotes - post.downVotes} votes</div>
                )
              }
            </div>
          : <div className="votePostContent">
              <button
                className={`votePostButton upVote ${alreadyUpVoted ? 'alreadyVoted' : ''}`}
                disabled={alreadyUpVoted || !permission.readAndWrite}
                onClick={upVotePost}>
                <Vote isUpVote />
              </button>
              {loading
                ? (
                <div className="spinnerContainer">
                  <Spinner />
                </div>
                )
                : (
                <div className="currentVotes">{post.upVotes - post.downVotes}</div>
                )
              }
              <button
                className={`votePostButton downVote ${alreadyDownVoted ? 'alreadyVoted' : ''}`}
                disabled={alreadyDownVoted || !permission.readAndWrite}
                onClick={downVotePost}>
                <Vote />
              </button>
            </div>
          }
      </div>
    </>
  );
}
