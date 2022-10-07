import { ForumPageContent } from '../../components/forums/forum/ForumPageContent';
import { useState, useEffect } from 'react';
import { getForumID } from '../../utils/getForumID';
import { useForum } from '../../contexts/DispatchProvider';

interface ForumViewProps {
  collectionId: string;
}

export const ForumView = (props: ForumViewProps): JSX.Element => {
  const forumId = props.collectionId;
  const { cluster } = useForum();
  const [forumKey, setForumKey] = useState<string>();
  useEffect(() => {
    async function getID(): Promise<void> {
      if (forumId !== undefined) {
        const forumId = await getForumID(cluster, props.collectionId);
        setForumKey(forumId);
      }
    }
    void getID();
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
