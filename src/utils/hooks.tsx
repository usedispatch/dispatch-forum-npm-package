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
