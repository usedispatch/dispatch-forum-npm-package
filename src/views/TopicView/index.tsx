import { useEffect, useState } from 'react';
import { useForum } from '../../contexts/DispatchProvider';
import {
  ForumIdentifier,
  ForumID,
  SolanartID,
  isSolanartID,
} from '../../types/ForumIdentifier';
import { getForumID } from '../../utils/apiHelper';
import { TopicPageContent } from '../../components/forums/topic/TopicPageContent';
import { Spinner } from '../../components/common';

interface TopicViewProps {
  topicId: number;
  forumId: ForumIdentifier<ForumID | SolanartID>;
  showTitle?: boolean;
}

const defaultProps: TopicViewProps = {
  showTitle: true,
};

export const TopicView = (props: TopicViewProps): JSX.Element => {
  const forum = useForum();

  const { forumId, topicId, showTitle } = props;
  const [forumKey, setForumKey] = useState<string>();

  useEffect(() => {
    async function getID(solanartID: string): Promise<void> {
      if (forumId !== undefined) {
        const id = await getForumID(forum.cluster, solanartID);
        setForumKey(id);
      }
    }
    if (isSolanartID(forumId)) {
      void getID(forumId.solanartID);
    } else {
      setForumKey(forumId.forumID);
    }
  }, [forum.cluster, forumId]);

  return (
    <div className="dsp- ">
      {
      // eslint-disable-next-line multiline-ternary
      forumKey !== undefined ? (
        <TopicPageContent forumId={forumKey} topicId={topicId} showTitle={showTitle}/>
      ) : (
        <Spinner/>
      )}
    </div>
  );
};

TopicView.defaultProps = defaultProps;
