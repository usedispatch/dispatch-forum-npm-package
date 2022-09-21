import { PublicKey } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import {
  getAssociatedTokenAddress,
  unpackAccount,
} from '@solana/spl-token';
import { DispatchForum } from '../postbox/postboxWrapper';
import { isSuccess } from '../../utils/loading';

/**
 * This hook returns whether the given user is a moderator for a
 * given forum. The hook returns true if the user is a mod, false
 * if the user is not a mod, or null if whether the user is a mod
 * or not has not been confirmed yet.
 * TODO(andrew): should there be better typing on this?
 */
export function useUserIsMod(
  /** The forum identifier, not to be confused with the collection identifier */
  forumId: PublicKey,
  /** The forum object, used for getting the moderator mint */
  forum: DispatchForum,
  /** The user's wallet public key */
  userPublicKey: PublicKey
): boolean | null {

  // At first, we don't know whether the user is a mod, so set to
  // null
  const [userIsMod, setUserIsMod] = useState<boolean | null>(null);

  // We want to check if the user holds the token associated with
  // the forum
  async function fetchUserIsMod(): Promise<boolean> {
    const moderatorMint = await forum.getModeratorMint(forumId);
    // only continue if the moderator mint is actually defined
    if (isSuccess(moderatorMint)) {
      const ataAddress = await getAssociatedTokenAddress(moderatorMint, userPublicKey);
      const ataBinary = await forum.connection.getAccountInfo(ataAddress);
      if (ataBinary) {
        const parsedAta = unpackAccount(ataAddress, ataBinary);
        if (parsedAta.amount > 0) {
          return true;
        } else {
          // If balance is not positive, user is not a mod
          return false;
        }
      } else {
        // If the account could not be fetched, user is not a mod
        // TODO(andrew) should this be an error case?
        return false;
      }
    } else {
      // If the moderator mint is somehow not defined, the user
      // is not a mod
      // TODO(andrew) if the moderator mint isn't defined, is
      // everyone a mod? Or is everyone not a mod?
      return false;
    }
  }

  useEffect(() => {
    // Fetch whether the user is a mod, then set the state
    // variable to that value
    fetchUserIsMod()
      .then((b) => setUserIsMod(b));
  }, [forumId, forum, userPublicKey]);

  return userIsMod;
}
