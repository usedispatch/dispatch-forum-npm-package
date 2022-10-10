import { ForumPageContent } from '../../components/forums/forum/ForumPageContent';
import { useState, useEffect } from 'react';
import { getForumID } from '../../utils/getForumID';
import { useForum } from '../../contexts/DispatchProvider';
import { Spinner } from '../../components/common';
import { ForumIdentifier, SolanartID, ForumID, isSolanartID } from '../../types/ForumIdentifier';

interface ForumViewProps {
  collectionId: ForumIdentifier<ForumID | SolanartID>;
}

export const ForumView = (props: ForumViewProps): JSX.Element => {
  const collectionId = props.collectionId;
  const { cluster } = useForum();
  const [forumKey, setForumKey] = useState<string>();
  useEffect(() => {
    async function getID(solanartID: string): Promise<void> {
      if (collectionId !== undefined) {
        const forumId = await getForumID(cluster, solanartID);
        setForumKey(forumId);
      }
    }

    if (isSolanartID(collectionId)) {
      void getID(collectionId.solanartID);
    } else {
      setForumKey(collectionId.forumID);
    }
  }, [cluster, collectionId]);

  return (
    <div className="dsp-">
      {(forumKey !== undefined)
        ? <ForumPageContent forumID={forumKey} />
        : <Spinner/>
      }
    </div>
  );
};
