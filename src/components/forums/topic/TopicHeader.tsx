import Markdown from 'markdown-to-jsx';
import Jdenticon from 'react-jdenticon';
import { ForumPost } from '@usedispatch/client';
import { getIdentity } from '../../../utils/identity';
import { RoleLabel } from './RoleLabel';
import { Spinner } from '../../common';
import { Info, Lock } from '../../../assets';
import { isEditedPost } from '../../../utils/hooks';
import { DispatchForum } from '../../../utils/postbox/postboxWrapper';
import { PublicKey } from '@solana/web3.js';
import { isSuccess } from '../../../utils/loading';

interface TopicHeaderProps {
  topic: ForumPost;
  forum: DispatchForum;
  participatingModerators: PublicKey[] | null;
  isGated: boolean;
}

export function TopicHeader(props: TopicHeaderProps): JSX.Element {
  const { isGated, topic, forum, participatingModerators } = props;

  const postedAt = isSuccess(topic)
    ? `${topic.data.ts.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })} at ${topic.data.ts.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: 'numeric',
    })}`
    : '-';

  const identity = getIdentity(topic.poster);

  return (
      <div className="topicHeader">
        <div className="topicTitle">
          <div className="posted">
            <div className="postedBy">
              By
              <div className="icon">
                {(identity != null)
                  ? (
                  <img
                    src={identity.profilePicture.href}
                    style={{ borderRadius: '50%' }}
                  />
                  )
                  : (
                  <Jdenticon value={topic.poster.toBase58()} alt="posterID" />
                  )}
              </div>
              <div className="posterId">
                {(identity != null) ? identity.displayName : topic.poster.toBase58()}
              </div>
              {/* TODO is it right to show an OP when the topic
              poster is obviously OP? if not, set the topicOwnerId
              prop to an unrelated key */}
              <RoleLabel
                topicOwnerId={topic.poster}
                posterId={topic.poster}
                moderators={participatingModerators}
              />
            </div>
            <div className="postedAt">
              {postedAt}
              <div className="accountInfo">
                <a
                  href={`https://solscan.io/account/${topic.address.toString()}${forum.cluster === 'devnet' ? `?cluster=${forum.cluster}` : ''}`}
                  className="transactionLink"
                  target="_blank" rel="noreferrer">
                  <Info />
                </a>
              </div>
            </div>
          </div>
          {!isEditedPost(topic)
            ? (
            <div className="subj">
              {isGated && (
                <div className="gatedTopic">
                  <Lock />
                </div>
              )}
              <Markdown>{topic?.data.subj ?? 'subject'}</Markdown>
            </div>
            )
            : (
            <Spinner />
            )}
        </div>
        {!isEditedPost(topic) && (
          <div className="topicBody">
            <Markdown>{topic?.data.body ?? 'body of the topic'}</Markdown>
          </div>
        )}
      </div>
  );
}
