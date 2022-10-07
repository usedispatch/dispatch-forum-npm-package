import { ForumPageContent } from '../../components/forums/forum/ForumPageContent';
import { useState, useEffect } from 'react';
import { getForumID } from '../../utils/getForumID';
import { useForum } from '../../contexts/DispatchProvider';
import { ForumIdentifier, SolanartID, ForumID, isSolanartID } from '../../types/ForumIdentifier';

interface ForumViewProps {
  collectionId: ForumIdentifier<ForumID | SolanartID>;
}

export const ForumView = (props: ForumViewProps): JSX.Element => {
  const forumId = props.collectionId;
  const { cluster } = useForum();
  const [forumKey, setForumKey] = useState<string>();
  useEffect(() => {
    async function getID(solanartID: string): Promise<void> {
      if (forumId !== undefined) {
        const id = await getForumID(cluster, solanartID);
        setForumKey(id);
      }
    }
    if (isSolanartID(forumId)) {
      void getID(forumId.solanartID);
    } else {
      setForumKey(forumId.forumID);
    }
  }, [cluster, forumId]);

  return (
    <div className="dsp-">
      {(forumKey !== undefined)
        ? <ForumPageContent forumID={forumKey} />
        : <div> loading </div>
      }
    </div>
  );
};
