import { web3 } from "@project-serum/anchor";

import { DispatchForum } from "utils/postbox/postboxWrapper";

export enum UserRoleType {
  Owner = "owner",
  Moderator = "mod",
  Poster = "poster",
}

export const userRole = async (
  forum: DispatchForum,
  collectionId: web3.PublicKey
) => {
  const [isMod, isOwner] = await Promise.all([
    forum.isModerator(collectionId),
    forum.isOwner(collectionId),
  ]);

  const value = isOwner
    ? UserRoleType.Owner
    : isMod
    ? UserRoleType.Moderator
    : UserRoleType.Poster;

  localStorage.setItem("role", value);
  return value;
};
