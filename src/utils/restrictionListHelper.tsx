import { PublicKey } from '@solana/web3.js';
import { PostRestriction } from '@usedispatch/client';
import { newPublicKey } from '../utils/postbox/validateNewPublicKey';
import { Result, DispatchError } from '../types/error';
import { isError, badInputError, errorSummary } from '../utils/error';
import isNil from 'lodash/isNil';

export function restrictionListToPubkey(
  restriction: PostRestriction,
): PublicKey[] {
  if (isNil(restriction)) {
    return [];
  }
  return !isNil(restriction.nftOwnership)
    ? [restriction.nftOwnership.collectionId]
    : !isNil(restriction.nftListAnyOwnership)
      ? restriction.nftListAnyOwnership.collectionIds
      : !isNil(restriction.tokenOwnership)
        ? [restriction.tokenOwnership.mint]
        : [];
}

export function restrictionListToString(
  restriction: PostRestriction,
): string[] {
  return restrictionListToPubkey(restriction).map((id) => id.toBase58());
}

// function cleans csv string, parses out into pubkeys,
// and returns a PostRestriction object
export function pubkeysToRestriction(
  pubkeyList: string,
  existingRestriction?: PostRestriction,
): Result<PostRestriction> {
  const tokenCSV = pubkeyList.replace(/\s+/g, '');
  const csvList = tokenCSV.split(',');

  const newIdResults = csvList.map((token) => {
    return newPublicKey(token);
  });

  // Collect all invalid pubkeys
  const pubkeyErrors = newIdResults.filter(
    pkey => isError(pkey),
  ) as DispatchError[];

  // If any pubkey is invalid...
  if (pubkeyErrors.length > 0) {
    return badInputError(
      pubkeyErrors
        .map(err => errorSummary(err))
        .join(', '),
    );
  }

  let newIds = newIdResults as PublicKey[];

  if (existingRestriction != null) {
    const existingIds = restrictionListToPubkey(existingRestriction);
    newIds = newIds.concat(existingIds);
  }

  if (newIds.length === 0) {
    return {
      null: {},
    };
  } else if (newIds.length === 1) {
    return {
      nftOwnership: { collectionId: newIds[0] },
    };
  } else {
    return {
      nftListAnyOwnership: {
        collectionIds: newIds,
      },
    };
  }
}

// add support for list?
export function pubkeysToSPLRestriction(
  pubkey: string,
  amount: number,
  decimals: number,
): Result<PostRestriction> {
  const tokenCSV = pubkey.replace(/\s+/g, '');
  const csvList = tokenCSV.split(',');

  const newIdResults = csvList.map((token) => {
    return newPublicKey(token);
  });

  // Collect all invalid pubkeys
  const pubkeyErrors = newIdResults.filter(
    pkey => isError(pkey),
  ) as DispatchError[];

  // If any pubkey is invalid...
  if (pubkeyErrors.length > 0) {
    return badInputError(
      pubkeyErrors
        .map(err => errorSummary(err))
        .join(', '),
    );
  }

  const newIds = newIdResults as PublicKey[];

  const tokenAmount = amount * 10 ** decimals;
  if (newIds.length === 0) {
    return {
      null: {},
    };
  } else if (newIds.length === 1) {
    return {
      tokenOwnership: { mint: newIds[0], amount: tokenAmount },
    };
  } else {
    return badInputError(
      'Only one SPL token can be specified',
      'Please remove all but one SPL token from the list',
    );
  }
}

export function removePubkeyFromRestriction(
  pubkey: string,
  restriction: PostRestriction,
): PostRestriction {
  const exitingId = newPublicKey(pubkey);
  const newIds = restrictionListToPubkey(restriction).filter(
    (id) => id !== exitingId,
  );

  const newRestriction = {
    nftListAnyOwnership: {
      collectionIds: newIds,
    },
  };

  return newRestriction;
}
