import * as _ from "lodash";
import { ReactNode, useEffect, useMemo, useState } from "react";
import Jdenticon from "react-jdenticon";
import { ForumPost } from "@usedispatch/client";

import { Award, MessageSquare, Trash } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  PermissionsGate,
  TransactionLink,
} from "../../common";
import { CreatePost, GiveAward, PostList, Notification, Votes } from "..";

import { usePath } from "../../../contexts/DispatchProvider";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";
import { UserRoleType } from "../../../utils/permissions";
import { SCOPES } from "../../../utils/permissions";
import { selectRepliesFromPosts } from "../../../utils/posts";
import { ForumData } from "../../../utils/hooks";
interface TopicContentProps {
  forum: DispatchForum;
  forumData: ForumData;
  update: () => Promise<void>;
  topic: ForumPost;
  userRole: UserRoleType;
  updateVotes: (upVoted: boolean) => void;
}

export function TopicContent(props: TopicContentProps) {
  const { forum, forumData, userRole, update, updateVotes, topic } = props;
  const replies = useMemo(() => {
    return selectRepliesFromPosts(forumData.posts, topic);
  }, [forumData]);
  const { buildForumPath } = usePath();
  const forumPath = buildForumPath(forumData.collectionId.toBase58());
  const permission = forum.permission;

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(false);

  const [isNotificationHidden, setIsNotificationHidden] = useState(true);
  const [notificationContent, setNotificationContent] = useState<{
    content: string | ReactNode;
    type: MessageType;
  }>();

  const [showAddAccessToken, setShowAddAccessToken] = useState(false);
  const [accessToken, setAccessToken] = useState<string>();
  const [addingAccessToken, setAddingAccessToken] = useState(false);

  const [showGiveAward, setShowGiveAward] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
    okPath?: string;
  } | null>(null);

  // TODO (Ana): add corresponding function when its available
  /*const addAccessToken = async () => {
    setAddingAccessToken(true);
    try {
      const token = newPublicKey(accessToken!);

      const tx = await Forum.setForumPostRestriction(collectionId, {
        tokenOwnership: { mint: token, amount: 1 },
      });

      setAccessToken("");
      setShowAddAccessToken(false);
      setAddingAccessToken(false);
      setAccessToken(undefined);
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: (
          <div className="successBody">
            <div>The access token was added</div>
            <TransactionLink transaction={tx} />
          </div>
        ),
      });
    } catch (error: any) {
      setAddingAccessToken(false);
      if (error.code !== 4001) {
        setAccessToken("");
        setShowAddAccessToken(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The access token could not be added`,
          collapsible: { header: "Error", content: JSON.stringify(error) },
        });
      }
    }
  }; */

  const onDeleteTopic = async () => {
    try {
      setDeletingTopic(true);
      const tx = await forum.deleteForumPost(
        topic,
        forumData.collectionId,
        userRole === UserRoleType.Moderator
      );
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: (
          <div className="successBody">
            <div>The topic and all its posts were deleted</div>
            <TransactionLink transaction={tx} />
          </div>
        ),
        okPath: forumPath,
      });
      update();
      setShowDeleteConfirmation(false);
      setDeletingTopic(false);
      return tx;
    } catch (error: any) {
      setDeletingTopic(false);
      setShowDeleteConfirmation(false);
      if (error.code === 4001) {
        setModalInfo({
          title: "The topic could not be deleted",
          type: MessageType.error,
          body: `The user cancelled the request`,
        });
      } else {
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The topic could not be deleted`,
          collapsible: { header: "Error", content: error.message },
        });
      }
    }
  };
  return (
    <>
      {!_.isNil(modalInfo) && (
        <PopUpModal
          id="topic-info"
          visible
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={modalInfo.body}
          collapsible={modalInfo.collapsible}
          okButton={
            <a
              className="okButton"
              href={modalInfo.okPath}
              onClick={() => setModalInfo(null)}>
              OK
            </a>
          }
        />
      )}
      {showAddAccessToken && _.isNil(modalInfo) && (
        <PopUpModal
          id="add-access-token"
          visible
          title="Limit post access"
          body={
            <div className="">
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
              />
            </div>
          }
          loading={addingAccessToken}
          onClose={() => setShowAddAccessToken(false)}
          okButton={
            <button className="okButton" disabled={accessToken?.length === 0}>
              Save
            </button>
          }
          cancelButton={
            <button
              className="cancelDeleteTopicButton"
              onClick={() => setShowAddAccessToken(false)}>
              Cancel
            </button>
          }
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
          cancelButton={
            <div
              className="cancelDeleteTopicButton"
              onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </div>
          }
        />
      )}
      {showGiveAward && (
        <GiveAward
          post={topic}
          collectionId={forumData.info.collectionId}
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
              onDownVotePost={() =>
                forum.voteDownForumPost(topic, forumData.info.collectionId)
              }
              onUpVotePost={() =>
                forum.voteUpForumPost(topic, forumData.info.collectionId)
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
          <TopicHeader topic={topic} />
          <div className="moderatorToolsContainer">
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
                delete topic
              </button>
              {/* TODO (Ana): waiting for endpoint to be implemented
              <button
                className="moderatorTool"
                disabled={!permission.readAndWrite}
                onClick={() => setShowAddAccessToken(true)}>
                <div className="lock">
                  <Lock />
                </div>
                manage post access
              </button> */}
            </PermissionsGate>
            <PermissionsGate scopes={[SCOPES.canCreateReply]}>
              <>
                <div className="actionDivider" />
                <button
                  className="awardButton"
                  disabled={!permission.readAndWrite}
                  onClick={() => setShowGiveAward(true)}>
                  Gift Award
                  <Award />
                </button>
              </>
            </PermissionsGate>
          </div>
          <PermissionsGate scopes={[SCOPES.canCreatePost]}>
            <CreatePost
              topicId={topic.postId}
              collectionId={forumData.info.collectionId}
              createForumPost={async (
                { subj, body, meta },
                topicId,
                collectionId
              ) => {
                const signature = forum.createForumPost(
                  { subj, body, meta },
                  topicId,
                  collectionId
                );
                return signature;
              }}
              update={update}
              onReload={() => {}}
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
        update={update}
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
        userRole={userRole}
      />
    </>
  );
}

interface TopicHeaderProps {
  topic: ForumPost;
}

function TopicHeader(props: TopicHeaderProps) {
  const { topic } = props;

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

  return (
    <div className="topicHeader">
      <div className="topicTitle">
        <div className="posted">
          <div className="postedBy">
            By
            <div className="icon">
              <Jdenticon value={topic?.poster.toBase58()} alt="posterID" />
            </div>
            <div className="posterId">{topic?.poster.toBase58()}</div>
          </div>
          <div className="postedAt">Posted at: {postedAt}</div>
        </div>
        <div className="subj">{topic?.data.subj ?? "subject"}</div>
      </div>
      <div className="topicBody">{topic?.data.body ?? "body of the topic"}</div>
    </div>
  );
}
