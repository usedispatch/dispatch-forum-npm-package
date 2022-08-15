  export enum UserRoleType {
    Owner = "owner",
    Moderator = "mod",
    Poster = "poster",
    Viewer = "viewer"
  }
  
  // examples
  export const SCOPES = {
    canView: "can-view",
    canCreateForum: "can-create-forum",
    canDeleteForum: "can-delete-forum",
    canEditMods: "edit-mods",
    canEditForum: "edit-forum",
    canClaimForum: "can-claim",
    canAddOwner: "can-add-forum",
    canDeleteOwner: "can-delete-forum",
    canCreateTopic: "can-create-topic",
    canDeleteTopic: "can-delete-topic",
    canVote: "can-vote",
    canAddForumRestriction: "can-add-forum-restriction",
    canRemoveForumRestriction: "can-remove-forum-restriction",
    canAddTopicRestriction: "can-add-topic-restriction",
    canRemoveTopicRestriction: "can-remove-topic-restriction",
    canCreatePost: "can-create-post",
    canDeletePost: "can-delete-post",
    canCreateReply: "can-create-reply",
    canDeleteReply: "can-delete-reply",
  };
  
  // default permissions
  export const PERMISSIONS = {
    [UserRoleType.Viewer]: [
        SCOPES.canView
    ],
    [UserRoleType.Poster]: [
        SCOPES.canVote,
        SCOPES.canCreateTopic,
        SCOPES.canCreatePost,
        SCOPES.canCreateReply
      ],
    [UserRoleType.Moderator]: [
        SCOPES.canVote,
        SCOPES.canCreateTopic,
        SCOPES.canCreatePost,
        SCOPES.canCreateReply,
        SCOPES.canDeleteTopic,
        SCOPES.canDeletePost,
        SCOPES.canDeleteReply,
        SCOPES.canAddTopicRestriction,
        SCOPES.canRemoveTopicRestriction
      ],
    [UserRoleType.Owner]: [
        SCOPES.canVote,
        SCOPES.canCreateTopic,
        SCOPES.canCreatePost,
        SCOPES.canCreateReply,
        SCOPES.canEditMods,
        SCOPES.canDeleteTopic,
        SCOPES.canDeletePost,
        SCOPES.canDeleteReply,
        SCOPES.canAddTopicRestriction,
        SCOPES.canRemoveTopicRestriction,
        SCOPES.canAddOwner,
        SCOPES.canDeleteOwner,
        SCOPES.canClaimForum,
        SCOPES.canEditForum
    ]
  };

  