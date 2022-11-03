import { maxBy, isNil } from 'lodash';
import { useMemo, useCallback } from 'react';
import Markdown from 'markdown-to-jsx';
import Jdenticon from 'react-jdenticon';
import { ForumPost } from '@usedispatch/client';

import { Link, Spinner } from '../../../../components/common';

import { ForumData } from '../../../../utils/hooks';
import { getIdentity } from '../../../../utils/identity';
import { isSuccess } from '../../../../utils/loading';
import { newPublicKey } from '../../../../utils/postbox/validateNewPublicKey';
import { selectForumPosts, selectRepliesFromPosts } from '../../../../utils/posts';
import { usePath } from '../../../../contexts/DispatchProvider';

import { TopicListRowAsMobile } from './TopicListRowAsMobile';

interface TopicListRowProps {
  topic: ForumPost;
  forumData: ForumData;
  isMobile?: boolean;
}

export function TopicListRow(props: TopicListRowProps): JSX.Element {
  const {
    topic, forumData, isMobile = false,
  } = props;
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

  const icons = useCallback((posts: ForumPost[]) => {
    if (posts.length > 0) {
      const ids = posts.slice(0, 8).map((p) => p.poster.toBase58());

      return (
          <div className="rowContentIcons">
            {ids.map((id, index) => {
              // TODO(andrew) better error-checking on this
              // newPublicKey call?
              const pkey = newPublicKey(id);
              if (isSuccess(pkey)) {
                const identity = getIdentity(pkey);
                return (
                  <div key={index} className={isMobile ? 'iconAsMobile' : 'icon'}>
                    { (identity != null)
                      ? <img
                        src={identity.profilePicture.href}
                        style={{ borderRadius: '50%' }}
                      />
                      : <Jdenticon value={id} alt="posterID" size={isMobile ? '16' : '100%'} />
                    }
                  </div>
                );
              } else {
                return null;
              }
            })}
            {posts.length > 8 ? '...' : null}
          </div>
      );
    } else {
      return '-';
    }
  }, []);

  if (isMobile) {
    return (
      <Link className="TopicListRowAsMobileLink" href={topicPath}>
        <TopicListRowAsMobile
          topic={topic}
          lastActivityDate={activtyDate(replies)}
          numberOfReplies={replies.length}
        />
      </Link>
    );
  }

  return (
      <tr className="row ">
        <th className="rowSubj">
          <Link className="" href={topicPath}>
            <div className="textBox">
              <Markdown>{topic.data.subj ?? ''}</Markdown>
            </div>
          </Link>
        </th>
        <td className="rowIconReplies">
          <Link className="" href={topicPath}>
            {icons(replies)}
          </Link>
        </td>
        <td className="rowAmountReplies">
          <Link className="" href={topicPath}>
            {replies.length}
          </Link>
        </td>
        <td className="rowDate">
          <Link className="" href={topicPath}>
            {activtyDate(replies)}
          </Link>
        </td>
      </tr>
  );
}

export function TopicInFlightRow({ title }: { title: string }): JSX.Element {
  return (
  <tr className="row topicInFlight">
    <th className="rowSubj">
      <div className='rowSubjInFlight'>
        <div className="textBox">
          {title}
        </div>
         <div className='confirmingTopic'>
          confirming
          <div className='loading'>
            <Spinner />
          </div>
        </div>
      </div>
    </th>
    <td className="rowIconReplies" > - </td>
    <td className="rowAmountReplies" > - </td>
    <td className="rowDate" > - </td>
  </tr>
  );
}
