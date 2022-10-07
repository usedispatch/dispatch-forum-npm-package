import { useEffect, useState } from 'react';
import { useForum } from '../../contexts/DispatchProvider';
import {
  ForumIdentifier,
  ForumID,
  SolanartID,
  isSolanartID,
} from '../../types/ForumIdentifier';
import { getForumID } from '../../utils/getForumID';
import { TopicPageContent } from '../../components/forums/topic/TopicPageContent';
interface Props {
  topicId: number;
  forumId: ForumIdentifier<ForumID | SolanartID>;
}

export const TopicView = (props: Props): JSX.Element => {
  const forum = useForum();

  const { forumId, topicId } = props;
  const [forumKey, setForumKey] = useState<string>();

  useEffect(() => {
    async function getID(solanartID: string): Promise<void> {
      if (forumId !== undefined) {
        const id = await getForumID(forum.cluster, solanartID);
        console.log('id', id);
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
        <TopicPageContent forumId={forumKey} topicId={topicId} />
      ) : (
        <div> loading </div>
      )}
    </div>
  );
};
