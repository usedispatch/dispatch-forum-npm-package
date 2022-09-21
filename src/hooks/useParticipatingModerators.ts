import { useState, useEffect } from 'react';
import { PublicKey, AccountInfo } from '@solana/web3.js';
import uniqBy from 'lodash/uniqBy';
import zip from 'lodash/zip';
import isNil from 'lodash/isNil';
import {
  getAssociatedTokenAddress,
  unpackAccount,
  Account
} from '@solana/spl-token';
import { getAccountsInfoPaginated } from "@usedispatch/client";

import { ForumData } from '../types/forumData';
import { Loading } from '../types/loading';
import { DispatchForum } from '../utils/postbox/postboxWrapper';
import {
  isSuccess,
} from '../utils/loading';

/*
 * Of the posters participating in this forum, return the set of
 * them that are moderators
 */
export function useParticipatingModerators(
  forumData: Loading<ForumData>,
  forum: DispatchForum
) {

  // TODO make this a result type/
  const [moderators, setModerators] = useState<PublicKey[] | null>(null);

  async function fetchParticipatingModerators(
    forumData: ForumData
  ) {
    const { moderatorMint } = forumData;

    // Fetch the authors of all posts, unique by base58 key
    const authors = uniqBy(
      forumData.posts.map(({ poster }) => poster),
      (pkey) => pkey.toBase58()
    );

    // Derive associated token accounts
    const atas = await Promise.all(authors.map(author => {
      return getAssociatedTokenAddress(moderatorMint, author);
    }));

    // Fetch the accounts
    const binaryAccounts = await getAccountsInfoPaginated(
      forum.connection, atas
    );

    const pairs = zip(authors, atas, binaryAccounts);

    // Filter out the nulls
    const nonnullPairs = pairs.filter(([wallet, ata, account]) => {
      return !isNil(wallet) && !isNil(ata) && !isNil(account);
    }) as [PublicKey, PublicKey, AccountInfo<Buffer>][];

    // Parse the accounts
    const parsedAccounts: [PublicKey, PublicKey, Account][] = nonnullPairs.map(([wallet, ata, account]) => {
      const unpacked = unpackAccount(ata, account);
      return [wallet, ata, unpacked];
    });

    // Filter out only the ones that hold the token
    const tokenHolders = parsedAccounts.filter(([/* skip */, /* skip */, account]) => {
      return account.amount > 0
    });

    const tokenHoldingWallets = tokenHolders.map(([wallet]) => wallet);

    return tokenHoldingWallets;
  }

  useEffect(() => {
    if (isSuccess(forumData)) {
      fetchParticipatingModerators(forumData)
        .then((moderators) => setModerators(moderators));
    }
  }, [forumData]);

  return moderators;
}
