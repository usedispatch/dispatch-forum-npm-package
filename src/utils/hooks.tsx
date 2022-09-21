import { useMemo, useState, useEffect, ReactNode } from "react";
import { PublicKey, AccountInfo } from "@solana/web3.js";
import { ForumPost, PostRestriction, getAccountsInfoPaginated, ChainVoteEntry } from "@usedispatch/client";
import uniqBy from 'lodash/uniqBy';
import zip from 'lodash/zip';
import isNil from 'lodash/isNil';
import {
  getAssociatedTokenAddress,
  unpackAccount,
  Account
} from '@solana/spl-token';
import { ForumData } from "../types/forumData";
import { Loading } from "../types/loading";
import { Result } from "../types/error";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
} from "../components/common";
import {
  initial,
  isInitial,
  isSuccess,
} from "../utils/loading";
import { DispatchForum } from "./postbox/postboxWrapper";

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

/**
 * If a forum was created for a particular client, we can keep
 * track of it here
 */
export enum ForumIdentity {
  DegenerateApeAcademy
}

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
