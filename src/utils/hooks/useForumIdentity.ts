import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { ForumIdentity } from '../../types/forumIdentity';


/**
 * Return the identity of a particular forum, or `null` if it
 * doesn't have one
 */
export function useForumIdentity(
  forumId: PublicKey
): ForumIdentity | null {
  return useMemo(() => {
    if (forumId.equals(
      // TODO(andrew) put this in a constant somewhere? it is
      // nice to have it literally specified at the point of use
      // to avoid confusion
      new PublicKey('DSwfRF1jhhu6HpSuzaig1G19kzP73PfLZBPLofkw6fLD')
    )) {
      return ForumIdentity.DegenerateApeAcademy;
    } else {
      return null;
    }
  }, [forumId]);
}
