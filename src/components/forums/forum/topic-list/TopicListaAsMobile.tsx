import { ForumPost } from '@usedispatch/client';
import { isNil } from 'lodash';

import { ForumData } from '../../../../utils/hooks';

import { TopicListRow } from './TopicListRow';

interface TopicListProps {
  topics: ForumPost[];
  topicInFlight?: { title: string };
  forumData?: ForumData;
}

export function TopicListAsMobile({ topics, topicInFlight, forumData }: TopicListProps): JSX.Element {
  if (isNil(forumData)) {
    return <></>;
  }

  return (
    <>
      <div className="topicListAsMobileTitle">Topics</div>
      {topics.map((topic, index) => (
        <TopicListRow key={index} topic={topic} forumData={forumData} isMobile />
      ))}
    </>
  );
};
