import { isNil } from 'lodash';
import { useMemo } from 'react';

import { TopicInFlightRow, TopicListRow } from './TopicListRow';

import {
  selectTopics,
  sortByVotes,
  selectForumPosts,
} from '../../../../utils/posts';
import { ForumData } from '../../../../utils/hooks';
import { useMediaQuery } from '../../../../utils/useMediaQuery';

export enum SortOptions {
  'popular' = 'popular',
  'recent' = 'recent',
}

interface TopicListProps {
  update: () => Promise<void>;
  sortBy?: SortOptions;
  forumData?: ForumData;
  topicInFlight?: { title: string };
}

export function TopicList({ forumData, topicInFlight, update, sortBy = SortOptions.popular }: TopicListProps): JSX.Element {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const topics = useMemo(() => {
    if (!isNil(forumData)) {
      const topics = selectTopics(forumData.posts);
      let sorted = topics;
      if (sortBy === SortOptions.popular) {
        sorted = sortByVotes(topics);
      } else {
        sorted = topics.sort((l, r) => r.data.ts.valueOf() - l.data.ts.valueOf());
      }
      return selectForumPosts(sorted);
    }
    return [];
  }, [forumData, sortBy]);

  if (isMobile) {
    return (
      <div className="topicListContainerMobile">
        <div className="topicListContentMobile">
          {!isNil(topicInFlight) && <TopicInFlightRow title={topicInFlight.title} />}
          {!isNil(forumData) && topics.map((topic, index) => (
            <TopicListRow key={index} topic={topic} forumData={forumData} isClearRow={index % 2 !== 0} update={update} />
          ))}
        </div>
        {(isNil(forumData) || topics.length === 0) && <div className="emptyTopicListMobile">No topics yet</div>}
      </div>
    );
  }

  return (
    <div className="topicListContainer">
      <div className="topicListContent">
        {!isNil(topicInFlight) && <TopicInFlightRow title={topicInFlight.title} />}
        {!isNil(forumData) && topics.map((topic, index) => (
          <TopicListRow key={index} topic={topic} forumData={forumData} isClearRow={index % 2 === 0} update={update} />
        ))}
      </div>
      {(isNil(forumData) || topics.length === 0) && <div className="emptyTopicList">No topics yet</div>}
    </div>
  );
}
