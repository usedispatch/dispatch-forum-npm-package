const NOTIFICATION_BANNER_TIMEOUT = 5000;

export { NOTIFICATION_BANNER_TIMEOUT };

export const ROLES = {
    viewer: "VIEWER",
    poster: "POSTER",
    moderator: "MODERATOR",
    owner: "OWNER"
  };
  
  // examples
  export const SCOPES = {
      canCreateForum: "can-create-forum",
      canDeleteForum: "can-delete-forum",
      canEditMods: "edit-mods",
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
    [ROLES.viewer]: {
    },
    [ROLES.poster]: [
        SCOPES.canVote,
        SCOPES.canCreateTopic,
        SCOPES.canCreatePost,
        SCOPES.canCreateReply,
      ],
    [ROLES.moderator]: [
        SCOPES.canVote,
        SCOPES.canCreateTopic,
        SCOPES.canCreatePost,
        SCOPES.canCreateReply,
        SCOPES.canEditMods,
        SCOPES.canDeleteTopic,
        SCOPES.canDeletePost,
        SCOPES.canDeleteReply,
        SCOPES.canAddTopicRestriction,
        SCOPES.canRemoveTopicRestriction
      ],
    [ROLES.owner]: [
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
        SCOPES.canClaimForum
    ]
  };
  