import { ForumPageContent } from '../../components/forums/forum/ForumPageContent';
import { useState, useEffect } from 'react';
import { getForumID, addSolanartIdToForum } from '../../utils/apiHelper';
import { useForum } from '../../contexts/DispatchProvider';
import { Spinner } from '../../components/common';
import { ForumIdentifier, SolanartID, ForumID, isSolanartID } from '../../types/ForumIdentifier';
import * as web3 from '@solana/web3.js';
import { newPublicKey } from '../../utils/postbox/validateNewPublicKey';
import { isSuccess } from '../../utils/loading';

interface ForumViewProps {
  collectionId: ForumIdentifier<ForumID | SolanartID>;
  showTitle?: boolean;
}

const defaultProps: ForumViewProps = {
  showTitle: true,
};

export const ForumView = (props: ForumViewProps): JSX.Element => {
  const { collectionId, showTitle } = props;
  const { cluster } = useForum();
  const [forumKey, setForumKey] = useState<string>();
  useEffect(() => {
    async function getID(solanartId: string): Promise<void> {
      if (collectionId !== undefined) {
        const forumId = await getForumID(cluster, solanartId);
        const forumPubKey = newPublicKey(forumId);
        if (isSuccess(forumPubKey)) {
          setForumKey(forumId);
        } else {
          const newForumId = web3.Keypair.generate().publicKey;
          await addSolanartIdToForum(cluster, solanartId, newForumId);
          setForumKey(newForumId.toBase58());
        }
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
        ? <ForumPageContent forumID={forumKey} showTitle={showTitle}/>
        : <Spinner/>
      }
    </div>
  );
};

ForumView.defaultProps = defaultProps;
