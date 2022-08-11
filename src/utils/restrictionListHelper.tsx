import { PublicKey } from "@solana/web3.js";
import { PostRestriction } from "@usedispatch/client";
import { newPublicKey } from "../utils/postbox/validateNewPublicKey";

// function cleans csv string, parses out into pubkeys,
// and returns a PostRestriction object
export function pubkeysToRestriction(
  pubkeyList: string,
  existingRestriction?: PostRestriction
): PostRestriction {
  const tokenCSV = pubkeyList.replace(/\s+/g, "");
  const csvList = tokenCSV.split(",");

  let newIds = csvList.map((token) => {
    return newPublicKey(token);
  });

  if (existingRestriction) {
    const existingIds = restrictionListToPubkey(existingRestriction);
    newIds = newIds.concat(existingIds);
  }

  if (newIds.length === 0) {
    return {
      null: {},
    } as PostRestriction;
  } else if (newIds.length === 1) {
    return {
      nftOwnership: { collectionId: newIds[0] },
    } as PostRestriction;
  } else {
    return {
      nftListAnyOwnership: {
        collectionIds: newIds,
      },
    } as PostRestriction;
  }
}

export function removePubkeyFromRestriction(
  pubkey: string,
  restriction: PostRestriction
): PostRestriction {
  const exitingId = newPublicKey(pubkey);
  const newIds = restrictionListToPubkey(restriction).filter(
    (id) => id !== exitingId
  );

  const newRestriction = {
    nftListAnyOwnership: {
      collectionIds: newIds,
    },
  } as PostRestriction;

  return newRestriction;
}

export function restrictionListToString(
  restriction: PostRestriction
): string[] {
  return restrictionListToPubkey(restriction).map((id) => id.toBase58());
}

export function restrictionListToPubkey(
  restriction: PostRestriction
): PublicKey[] {
  return restriction.nftOwnership
    ? [restriction.nftOwnership.collectionId]
    : restriction.nftListAnyOwnership
    ? restriction.nftListAnyOwnership.collectionIds
    : restriction.tokenOwnership
    ? [restriction.tokenOwnership.mint]
    : [];
}
