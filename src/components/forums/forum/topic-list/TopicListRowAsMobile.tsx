import { ForumPost } from '@usedispatch/client';

import { MessageSquare, Vote } from '../../../../assets';

interface TopicListRowAsMobileProps {
  topic: ForumPost;
  lastActivityDate: string;
  numberOfReplies: number;
}

export function TopicListRowAsMobile(props: TopicListRowAsMobileProps): JSX.Element {
  const { topic, lastActivityDate, numberOfReplies } = props;

  const { data: { subj, body }, upVotes, downVotes } = topic;
  const currentVotes = upVotes - downVotes;

  return (
    <div className='topicListRowAsMobileContainer'>
      <h3 className='topicListRowAsMobileTitle'>{subj}</h3>
      <span className='topicListRowAsMobileBody'>{body}</span>
      <div className='topicListRowAsMobileBottomData'>
        <div className="topicListRowAsMobilecommentsContainer">
          <div className="topicListRowAsMobilecommentsComments">
            <div className="topicListRowAsMobileImage">
              <MessageSquare />
            </div>
            <span className="topicListRowAsMobileNumberOfReplies">{numberOfReplies}</span>
          </div>
          <div className="topicListRowAsMobileVotesContainer">
            <Vote isUpVote />
            <span className="topicListRowAsMobileVotes">{currentVotes}</span>
            <Vote isUpVote={false} />
          </div>
        </div>
        <span className='topicListRowAsMobileLastActivity'>
          {lastActivityDate}
        </span>
      </div>
    </div>
  );
}
