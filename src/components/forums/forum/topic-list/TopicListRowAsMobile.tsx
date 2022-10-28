import Markdown from 'markdown-to-jsx';
import { ForumPost } from '@usedispatch/client';

import { ForumData } from '../../../../utils/hooks';

interface TopicListRowAsMobileProps {
  topic: ForumPost;
  icons: JSX.Element | string;
  numberOfReplies: number;
  lastActivityDate: string;
}


export function TopicListRowAsMobile(props: TopicListRowAsMobileProps): JSX.Element {
  const {
    topic, icons, numberOfReplies, lastActivityDate,
  } = props;

  return (
    <div className='topicListRowAsMobileContainer'>
      <h3 className='topicListRowAsMobileTitle'>{topic.data.subj}</h3>
      <div className='topicListRowAsMobilePostersContainer'>
        <span className='topicListRowAsMobilePostersText'>Posters:</span>
        {icons}
      </div>
      <div className='topicListRowAsMobileBottomData'>
        <span>{`${numberOfReplies} replies`}</span>
        <span>{`Last activity: ${lastActivityDate}`}</span>
      </div>
    </div>
  );
};
