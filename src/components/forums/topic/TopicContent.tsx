import isNil from 'lodash/isNil';
import { ReactNode, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import Markdown from "markdown-to-jsx";
import Jdenticon from "react-jdenticon";
import { ForumPost, PostRestriction } from "@usedispatch/client";
import ReactGA from "react-ga4";

import { Gift, Info, MessageSquare, Trash, Lock } from "../../../assets";

import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  PermissionsGate,
  TransactionLink,
  Spinner,
} from "../../common";
import { CreatePost, GiveAward, PostList, Notification, Votes } from "..";
import { EditPost } from "./EditPost";
import { RoleLabel } from "./RoleLabel";

import { usePath } from "../../../contexts/DispatchProvider";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";
import { UserRoleType } from "../../../utils/permissions";
import { SCOPES } from "../../../utils/permissions";
import { selectRepliesFromPosts } from "../../../utils/posts";
import { getIdentity } from "../../../utils/identity";
import {
  ForumData,
  CreatedPost,
  EditedPost,
  isEditedPost,
  useUserIsMod,
  useForumIdentity,
  ForumIdentity,
} from "../../../utils/hooks";
import { isSuccess } from '../../../utils/loading';
import { errorSummary } from '../../../utils/error';
import {
  restrictionListToString,
  pubkeysToRestriction,
} from "../../../utils/restrictionListHelper";

interface TopicContentProps {
  forum: DispatchForum;
  forumData: ForumData;
  participatingModerators: PublicKey[] | null;
  update: () => Promise<void>;
  addPost: (post: CreatedPost) => void;
  editPost: (post: ForumPost, newBody: string, newSubj?: string) => void;
  deletePost: (post: ForumPost) => void;
  topic: ForumPost | EditedPost;
  userRoles: UserRoleType[];
  updateVotes: (upVoted: boolean) => void;
}

export function TopicContent(props: TopicContentProps) {
  const {
    forum,
    forumData,
    userRoles,
    update,
    addPost,
    editPost,
    deletePost,
    updateVotes,
    topic,
    participatingModerators,
  } = props;
  const replies = useMemo(() => {
    return selectRepliesFromPosts(forumData.posts, topic);
  }, [forumData]);
  process.env.REACT_APP_DEBUG_MODE === "true" &&
    console.log(topic.address.toBase58());
  const { buildForumPath } = usePath();
  const forumPath = buildForumPath(forumData.collectionId.toBase58());
  const permission = forum.permission;
  const restrictionSetting = topic.settings.find((setting) => {
    return setting.postRestriction;
  });
  const postRestriction = restrictionSetting?.postRestriction
    ? restrictionSetting.postRestriction.postRestriction
    : ({} as PostRestriction);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(false);
  const [currentForumAccessToken, setCurrentForumAccessToken] = useState<
    string[]
  >(() => restrictionListToString(postRestriction));
  const [isNotificationHidden, setIsNotificationHidden] = useState(true);
  const [notificationContent, setNotificationContent] = useState<{
    content: string | ReactNode;
    type: MessageType;
  }>();

  const userIsMod = useUserIsMod(
    forumData.collectionId,
    forum,
    // TODO(andrew): maybe a better way to mock this up
    forum.wallet.publicKey || new PublicKey("11111111111111111111111111111111")
  );

  const forumIdentity = useForumIdentity(forumData.collectionId);

  const [showAddAccessToken, setShowAddAccessToken] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");
  const [addingAccessToken, setAddingAccessToken] = useState(false);

  const [showGiveAward, setShowGiveAward] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
    okPath?: string;
  } | null>(null);

  /**
   * Whether a post is currently being created.
   * This allows us to lock the UI to stop a user from posting
   * again
   */
  const [postInFlight, setPostInFlight] = useState(false);

  // TODO (Ana): add corresponding function when its available
  // const addAccessToken = async () => {
  //   setAddingAccessToken(true);
  //   try {
  //     const restriction = pubkeysToRestriction(accessToken, postRestriction);
  //      TODO: Modify function below
  //     const tx = await forum.setForumPostRestriction(
  //       forumData.collectionId,
  //       restriction
  //     );
  //     const currentIds = restrictionListToString(restriction);

  //     setAccessToken("");
  //     setShowAddAccessToken(false);
  //     setAddingAccessToken(false);
  //     setModalInfo({
  //       title: "Success!",
  //       type: MessageType.success,
  //       body: (
  //         <div className="successBody">
  //           <div>The access token was added</div>
  //           <TransactionLink transaction={tx} />
  //         </div>
  //       ),
  //     });
  //     setCurrentForumAccessToken(currentIds);
  //   } catch (error: any) {
  //     setAddingAccessToken(false);
  //     if (error.code !== 4001) {
  //       setAccessToken("");
  //       setShowAddAccessToken(false);
  //       setModalInfo({
  //         title: "Something went wrong!",
  //         type: MessageType.error,
  //         body: `The access token could not be added`,
  //         collapsible: { header: "Error", content: JSON.stringify(error) },
  //       });
  //     }
  //   }
  // };

  const onDeleteTopic = async () => {
    setDeletingTopic(true);
    const tx = await forum.deleteForumPost(
      topic,
      forumData.collectionId,
      userRoles.includes(UserRoleType.Moderator)
    );

    if (isSuccess(tx)) {
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: (
          <div className="successBody">
            <div>
              The topic is being deleted and you will be redirected back to the
              forum momentarily
            </div>
            <TransactionLink transaction={tx} />
          </div>
        ),
        okPath: forumPath,
      });
      setShowDeleteConfirmation(false);
      // When the topic is confirmed deleted, redirect to the
      // parent URL (the main forum)
      await forum.connection.confirmTransaction(tx).then(() => {
        location.assign(`${forumPath}${location.search}`);
      });

      return tx;
    } else {
      const error = tx;
      setDeletingTopic(false);
      setShowDeleteConfirmation(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The topic could not be deleted`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
    }
  }

  return (
    <>
      {!isNil(modalInfo) && (
        <PopUpModal
          id="topic-info"
          visible
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={modalInfo.body}
          collapsible={modalInfo.collapsible}
          okButton={
            <button className="okButton" onClick={() => setModalInfo(null)}>
              OK
            </button>
          }
        />
      )}
      {ReactGA.send("pageview")}

      {showAddAccessToken && isNil(modalInfo) && (
        <PopUpModal
          id="add-access-token"
          visible
          title="Limit post access"
          body={
            <div className="">
              {/* TODO: Add buttons when modifying topic settings is available
               You can enter one token mint ID here such that only holders of
              this token can participate in this topic. This mint can be for any
              spl-token, eg SOL, NFTs, etc.
              <input
                type="text"
                placeholder="Token mint ID"
                className="newAccessToken"
                name="accessToken"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              /> */}
              <label className="addModeratorsLabel">
                Current NFT Collection IDs
              </label>
              {currentForumAccessToken.length === 0 && (
                <div className="noRestriction">
                  The topic has no restriction
                </div>
              )}
              {currentForumAccessToken.map((token) => {
                return <div className="currentAccessToken">{token}</div>;
              })}
            </div>
          }
          loading={addingAccessToken}
          onClose={() => setShowAddAccessToken(false)}
          // TODO: Add buttons when modifying topic settings is available
          // okButton={
          //   <button
          //     className="okButton"
          //     disabled={accessToken?.length === 0}
          //     onClick={(e) => addAccessToken()}
          //   >
          //     Save
          //   </button>
          // }
          // cancelButton={
          //   <button
          //     className="cancelDeleteTopicButton"
          //     onClick={() => setShowAddAccessToken(false)}
          //   >
          //     Cancel
          //   </button>
          // }
        />
      )}
      {showDeleteConfirmation && (
        <PopUpModal
          id="topic-delete-confirmation"
          visible
          title="Are you sure you want to delete this topic?"
          body={
            "This is permanent and you won't be able to access this topic again. All the posts here will be deleted too."
          }
          loading={deletingTopic}
          okButton={
            <a className="acceptDeleteTopicButton" onClick={onDeleteTopic}>
              Confirm
            </a>
          }
          onClose={() => setShowDeleteConfirmation(false)}
        />
      )}
      {showGiveAward && (
        <GiveAward
          post={topic}
          collectionId={forumData.collectionId}
          onCancel={() => setShowGiveAward(false)}
          onSuccess={(notificationContent) => {
            setShowGiveAward(false);
            setIsNotificationHidden(false);
            setNotificationContent({
              content: notificationContent,
              type: MessageType.success,
            });
            setTimeout(
              () => setIsNotificationHidden(true),
              NOTIFICATION_BANNER_TIMEOUT
            );
          }}
          onError={(error) => {
            setShowGiveAward(false);
            setModalInfo({
              title: "Something went wrong!",
              type: MessageType.error,
              body: `The award could not be given.`,
              collapsible: { header: "Error", content: error?.message },
            });
          }}
        />
      )}
      <div className="topicContentBox">
        <div className="activityInfo">
          <PermissionsGate scopes={[SCOPES.canVote]}>
            <Votes
              forumData={forumData}
              update={update}
              onDownVotePost={() =>
                forum.voteDownForumPost(topic, forumData.collectionId)
              }
              onUpVotePost={() =>
                forum.voteUpForumPost(topic, forumData.collectionId)
              }
              post={topic}
              updateVotes={(upVoted) => updateVotes(upVoted)}
            />
          </PermissionsGate>
          <div className="commentsContainer">
            <div className="image">
              <MessageSquare />
            </div>
            {replies.length}
          </div>
        </div>
        <div className="headerAndActions">
          <TopicHeader
            topic={topic}
            forum={forum}
            participatingModerators={participatingModerators}
            isGated={currentForumAccessToken.length > 0}
          />
          <div className="moderatorToolsContainer">
            <div className="topicTools">
              <PermissionsGate
                scopes={[SCOPES.canDeleteTopic]}
                posterKey={topic.poster}>
                <button
                  className="moderatorTool"
                  disabled={!permission.readAndWrite}
                  onClick={() => setShowDeleteConfirmation(true)}>
                  <div className="delete">
                    <Trash />
                  </div>
                </button>
                <div className="actionDivider" />
              </PermissionsGate>
              <EditPost
                post={topic}
                forumData={forumData}
                update={() => update()}
                editPostLocal={editPost}
                showDividers={{ leftDivider: false, rightDivider: true }}
              />
              <div className="lock">
                <Lock />
              </div>
              <button
                className="moderatorTool"
                disabled={!permission.readAndWrite}
                onClick={() => setShowAddAccessToken(true)}>
                <span>Manage post access</span>
                <div className="lock">
                  <Lock />
                </div>
              </button>
            </div>
            {
              // The gifting UI should be hidden on the apes forum for non-mods.
              // Therefore, show it if the forum is NOT degen apes, or the user is a mod
              (forumIdentity !== ForumIdentity.DegenerateApeAcademy ||
                userIsMod) &&
                !forum.wallet.publicKey?.equals(topic.poster) && (
                  <PermissionsGate scopes={[SCOPES.canCreateReply]}>
                    <button
                      className="awardButton"
                      disabled={!permission.readAndWrite}
                      onClick={() => setShowGiveAward(true)}>
                      <span>Send Token</span>
                      <Gift />
                    </button>
                  </PermissionsGate>
                )
            }
          </div>
          <PermissionsGate scopes={[SCOPES.canCreatePost]}>
            <CreatePost
              topic={topic}
              collectionId={forumData.collectionId}
              createForumPost={async (
                { subj, body, meta },
                topicId,
                collectionId
              ) => {
                setPostInFlight(true);
                const signature = forum.createForumPost(
                  { subj, body, meta },
                  topicId,
                  collectionId
                );
                return signature;
              }}
              update={update}
              addPost={addPost}
              onReload={() => {}}
              postInFlight={postInFlight}
              setPostInFlight={setPostInFlight}
            />
          </PermissionsGate>
        </div>
      </div>
      <Notification
        hidden={isNotificationHidden}
        content={notificationContent?.content}
        type={notificationContent?.type}
        onClose={() => setIsNotificationHidden(true)}
      />
      <PostList
        forum={forum}
        forumData={forumData}
        participatingModerators={participatingModerators}
        update={update}
        addPost={addPost}
        editPost={editPost}
        deletePost={deletePost}
        topic={topic}
        onDeletePost={async (tx) => {
          setIsNotificationHidden(false);
          setNotificationContent({
            content: (
              <>
                Post deleted successfully.
                <TransactionLink transaction={tx} />
              </>
            ),
            type: MessageType.success,
          });
          setTimeout(
            () => setIsNotificationHidden(true),
            NOTIFICATION_BANNER_TIMEOUT
          );
          // TODO refresh here
        }}
        userRoles={userRoles}
        postInFlight={postInFlight}
        setPostInFlight={setPostInFlight}
      />
    </>
  );
}

interface TopicHeaderProps {
  topic: ForumPost;
  forum: DispatchForum;
  participatingModerators: PublicKey[] | null;
  isGated: boolean;
}

function TopicHeader(props: TopicHeaderProps) {
  const { isGated, topic, forum, participatingModerators } = props;

  const postedAt = topic
    ? `${topic.data.ts.toLocaleDateString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      })} at ${topic.data.ts.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "numeric",
      })}`
    : "-";

  const identity = getIdentity(topic.poster);

  return (
    <div className="topicHeader">
      <div className="topicTitle">
        <div className="posted">
          <div className="postedBy">
            By
            <div className="icon">
              {identity ? (
                <img
                  src={identity.profilePicture.href}
                  style={{ borderRadius: "50%" }}
                />
              ) : (
                <Jdenticon value={topic.poster.toBase58()} alt="posterID" />
              )}
            </div>
            <div className="posterId">
              {identity ? identity.displayName : topic.poster.toBase58()}
            </div>
            {/* TODO is it right to show an OP when the topic
            poster is obviously OP? if not, set the topicOwnerId
            prop to an unrelated key */}
            <RoleLabel
              topicOwnerId={topic.poster}
              posterId={topic.poster}
              moderators={participatingModerators}
            />
          </div>
          <div className="postedAt">
            {postedAt}
            <div className="accountInfo">
              <a
                href={`https://solscan.io/account/${topic.address}?cluster=${forum.cluster}`}
                className="transactionLink"
                target="_blank">
                <Info />
              </a>
            </div>
          </div>
        </div>
        {!isEditedPost(topic) ? (
          <div className="subj">
            {isGated && (
              <div className="gatedTopic">
                <Lock />
              </div>
            )}
            <Markdown>{topic?.data.subj ?? "subject"}</Markdown>
          </div>
        ) : (
          <Spinner />
        )}
      </div>
      {!isEditedPost(topic) && (
        <div className="topicBody">
          <Markdown>{topic?.data.body ?? "body of the topic"}</Markdown>
        </div>
      )}
    </div>
  );
}
