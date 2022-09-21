import { PublicKey } from '@solana/web3.js';
import { ForumPost } from "@usedispatch/client";
import isUndefined from "lodash/isUndefined";
import { DispatchForum } from '@postbox';
import { UserRoleType } from '@utils';
import { UserObject } from "contexts/DispatchProvider";

export const getUserRole = async (
  forum: DispatchForum,
  collectionId: PublicKey,
  roleContext: UserObject,
  topic?: ForumPost
) => {
  if (isUndefined(topic)) {
    const [isMod, isOwner, canCreateTopic] = await Promise.all([
      forum.isModerator(collectionId),
      forum.isOwner(collectionId),
      forum.canCreateTopic(collectionId),
    ]);
    let roles = <UserRoleType[]>[];
    isOwner && roles.push(UserRoleType.Owner)
    isMod && roles.push(UserRoleType.Moderator)
    canCreateTopic && roles.push(UserRoleType.Poster)
    if (roles.length === 0) {
      roles.push(UserRoleType.Viewer)
    }
    roleContext.setRoles(roles);
  } else {
    const [isMod, isOwner, canPost] = await Promise.all([
      forum.isModerator(collectionId),
      forum.isOwner(collectionId),
      forum.canPost(collectionId, topic),
    ]);
    let roles = <UserRoleType[]>[];
    isOwner && roles.push(UserRoleType.Owner)
    isMod && roles.push(UserRoleType.Moderator)
    canPost && roles.push(UserRoleType.Poster)
    if (roles.length === 0) {
      roles.push(UserRoleType.Viewer)
    }
    roleContext.setRoles(roles);
  }
};
