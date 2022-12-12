import { maxBy, isNil } from 'lodash';
import { useMemo, useCallback } from 'react';
import Markdown from 'markdown-to-jsx';
import Jdenticon from 'react-jdenticon';
import { ForumPost } from '@usedispatch/client';

import { MessageSquare } from '../../../../assets';
import { Link, PermissionsGate, Spinner } from '../../../../components/common';
import { Votes } from '../../../../components/forums';

import { ForumData, isForumPost } from '../../../../utils/hooks';
import { getIdentity } from '../../../../utils/identity';
import { selectForumPosts, selectRepliesFromPosts } from '../../../../utils/posts';
import { SCOPES } from '../../../../utils/permissions';
import { useForum, usePath } from '../../../../contexts/DispatchProvider';

interface TopicListRowProps {
  topic: ForumPost;
  forumData: ForumData;
  update: () => Promise<void>;
  isClearRow: boolean;
}

export function TopicListRow(props: TopicListRowProps): JSX.Element {
  const { topic, forumData, isClearRow, update } = props;
  const forum = useForum();
  const { buildTopicPath } = usePath();
  const topicPath = buildTopicPath(
    forumData.collectionId.toBase58(),
    topic.postId,
  );

  const replies: ForumPost[] = useMemo(() => {
    return selectForumPosts(selectRepliesFromPosts(forumData.posts, topic));
  }, [forumData]);

  const activtyDate = useCallback((posts: ForumPost[]) => {
    const dates = posts.map(({ data }) => data.ts);
    const mostRecentDate = maxBy(dates, (date) => date.getTime());
    if (!isNil(mostRecentDate)) {
      const format = (
        mostRecentDate.getFullYear() !== new Date().getFullYear()
          ? {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }
          : {
            year: undefined,
            month: 'short',
            day: 'numeric',
          }
      ) as Intl.DateTimeFormatOptions;

      return mostRecentDate.toLocaleDateString(undefined, { ...format });
    } else {
      return '-';
    }
  }, []);

  const updateVotes = (upVoted: boolean): void => {
    if (isForumPost(topic)) {
      if (upVoted) {
        topic.upVotes = topic.upVotes + 1;
      } else {
        topic.downVotes = topic.downVotes + 1;
      }
    }
  };

  const posterIdentity = getIdentity(topic.poster);
  const posterKey = `${topic.poster.toBase58().substring(0, 4)}...${topic.poster.toBase58().slice(-4)}`;

  return (
      <div className={`row ${isClearRow ? 'clear' : ''}`}>
        <div className='rowHeader'>
          <div className='rowPosterInfo'>
            <div className='topicPosterIcon'>
              { !isNil(posterIdentity)
                ? <img
                    src={posterIdentity.profilePicture.href}
                    style={{ borderRadius: '50%' }}
                  />
                : <Jdenticon value={topic.poster.toBase58()} alt="posterID" size={'24'} />
              }
            </div>
            <>
              { posterIdentity ?? posterKey}
            </>
          </div>
          <div className="topicDate">
            {activtyDate(replies)}
          </div>
        </div>
        <Link href={topicPath} className='rowWrapper'>
          <div className="rowSubj">
            <Markdown>{topic.data.subj ?? ''}</Markdown>
          </div>
        </Link>
        <div className="rowActivity">
          <div className='votes'>
            <PermissionsGate scopes={[SCOPES.canVote]}>
              <Votes
                forumData={forumData}
                update={update}
                onDownVotePost={async () =>
                  forum.voteDownForumPost(topic, forumData.collectionId)
                }
                onUpVotePost={async () =>
                  forum.voteUpForumPost(topic, forumData.collectionId)
                }
                post={topic}
                updateVotes={upVoted => updateVotes(upVoted)}
              />
            </PermissionsGate>
          </div>
          <div className="rowReplies">
            <MessageSquare />
            <>{replies.length}</>
          </div>
        </div>
      </div>
  );
}

export function TopicInFlightRow({ title }: { title: string }): JSX.Element {
  return (
  <div className="row topicInFlight">
    <div className='rowSubjInFlight'>
      <div className='titleInFlight'>
        {title}
      </div>
      <div className='confirmingTopic'>
        confirming
        <div className='loading'>
          <Spinner />
        </div>
      </div>
    </div>
  </div>
  );
}
