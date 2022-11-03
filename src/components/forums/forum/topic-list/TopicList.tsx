import { isNil, update } from 'lodash';
import { useMemo } from 'react';

import { TopicInFlightRow, TopicListRow } from './TopicListRow';

import {
  selectTopics,
  sortByVotes,
  selectForumPosts,
} from '../../../../utils/posts';
import { ForumData } from '../../../../utils/hooks';
import { useMediaQuery } from '../../../../utils/useMediaQuery';
import { TopicListAsMobile } from './TopicListaAsMobile';

interface TopicListProps {
  forumData?: ForumData;
  topicInFlight?: { title: string };
}

export function TopicList({ forumData, topicInFlight }: TopicListProps): JSX.Element {
  const isMobile = useMediaQuery(`(max-width: 768px)`);

  const topics = useMemo(() => {
    if (!isNil(forumData)) {
      const topics = selectTopics(forumData.posts);
      const sorted = sortByVotes(topics);
      return selectForumPosts(sorted);
    }
    return [];
  }, [forumData]);

  function renderTopics(): JSX.Element {
    if (isMobile) {
      return (
        <TopicListAsMobile topics={topics} topicInFlight={topicInFlight} forumData={forumData} />
      );
    }

    return (
      <table className="tableContainer">
          <thead>
            <tr className="tableHeader">
              <th className="tableHeaderTitle">
                <div className="tableHeaderText">Topics</div>
              </th>
              <th className="tableHeaderTitle">
                <div className="tableHeaderText posters">Wallets</div>
              </th>
              <th className="tableHeaderTitle">
                <div className="tableHeaderTextCenter">Replies</div>
              </th>
              <th className="tableHeaderTitle">
                <div className="tableHeaderTextCenter">Activity</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {!isNil(topicInFlight) && <TopicInFlightRow title={topicInFlight.title} />}
            {!isNil(forumData) && topics.map((topic, index) => (
              <TopicListRow key={index} topic={topic} forumData={forumData} />
            ))}
          </tbody>
        </table>
    );
  }

  return(
    <div className="topicListContainer">
      <div>
        {renderTopics()}
        {(isNil(forumData) || topics.length === 0) && <div className="emptyTopicList">No topics yet</div>}
      </div>
    </div>
  );
};
