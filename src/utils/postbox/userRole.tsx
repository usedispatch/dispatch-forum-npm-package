import { web3 } from "@project-serum/anchor";
import { ForumPost } from "@usedispatch/client";
import { isUndefined } from "lodash";
import { DispatchForum } from "./postboxWrapper";
import { UserRoleType } from "../../utils/permissions";
import { UserObject } from "contexts/DispatchProvider";

export const getUserRole = async (
  forum: DispatchForum,
  collectionId: web3.PublicKey,
  roleContext: UserObject,
  topic?: ForumPost
) => {
    if (isUndefined(topic)) {
      const [isMod, isOwner, canCreateTopic] = await Promise.all([
          forum.isModerator(collectionId),
          forum.isOwner(collectionId),
          forum.canCreateTopic(collectionId)
        ]);
        const value = isOwner
        ? UserRoleType.Owner
        : isMod
        ? UserRoleType.Moderator
        : canCreateTopic
        ? UserRoleType.Poster
        : UserRoleType.Viewer;
        roleContext.setRole(value);
    } else {
        const [ isMod, isOwner, canPost] = await Promise.all([
            forum.isModerator(collectionId),
            forum.isOwner(collectionId),
            forum.canPost(collectionId, topic)
        ]);
        const value = isOwner
            ? UserRoleType.Owner
            : isMod
            ? UserRoleType.Moderator
            : canPost
            ? UserRoleType.Poster
            : UserRoleType.Viewer;
        roleContext.setRole(value);
  }
};