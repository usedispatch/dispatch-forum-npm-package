import { isNil } from 'lodash';
import { useMemo } from 'react';

import { TopicInFlightRow, TopicListRow } from './TopicListRow';

import {
  selectTopics,
  sortByVotes,
  selectForumPosts,
} from '../../../utils/posts';
import { ForumData } from '../../../utils/hooks';

interface TopicListProps {
  forumData?: ForumData;
  topicInFlight?: { title: string };
}

export function TopicList({ forumData, topicInFlight }: TopicListProps): JSX.Element {
  if (isNil(forumData)) {
    return (
    <div className="topicListContainer">
      <div>
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
          </tbody>
        </table>
        <div className="emptyTopicList">No topics yet</div>
      </div>
    </div>
    );
  } else {
    const topics = useMemo(() => {
      const topics = selectTopics(forumData.posts);
      const sorted = sortByVotes(topics);
      return selectForumPosts(sorted);
    }, [forumData]);

    return (
    <div className="topicListContainer">
      <div>
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
            {topics.map((topic, index) => (
              <TopicListRow key={index} topic={topic} forumData={forumData} />
            ))}
          </tbody>
        </table>
        {topics.length === 0 && (
          <div className="emptyTopicList">No topics yet</div>
        )}
      </div>
    </div>
    );
  }
}
