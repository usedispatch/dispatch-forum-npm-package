import isNil from 'lodash/isNil';
import { ReactNode, useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import Markdown from 'markdown-to-jsx';
import Jdenticon from 'react-jdenticon';
import { ForumPost, PostRestriction } from '@usedispatch/client';
import ReactGA from 'react-ga4';

import {
  Gift, MessageSquare, Trash, Lock,
} from '../../../assets';

import {
  AccountInfoLink,
  CollapsibleProps,
  MessageType,
  PopUpModal,
  PermissionsGate,
  TransactionLink,
  Spinner,
} from '../../common';
import { CreatePost, GiveAward, PostList, Notification, RoleLabel, EditPost, Votes } from '..';

import { usePath } from '../../../contexts/DispatchProvider';

import { DispatchForum } from '../../../utils/postbox/postboxWrapper';
import { NOTIFICATION_BANNER_TIMEOUT } from '../../../utils/consts';
import { UserRoleType, SCOPES } from '../../../utils/permissions';
import { selectRepliesFromPosts } from '../../../utils/posts';
import { getIdentity } from '../../../utils/identity';
import {
  ForumData,
  CreatedPost,
  EditedPost,
  useForumIdentity,
  ForumIdentity,
  isEditedPost,
} from '../../../utils/hooks';
import { isSuccess } from '../../../utils/loading';
import { errorSummary } from '../../../utils/error';
import { restrictionListToString } from '../../../utils/restrictionListHelper';

interface TopicHeaderProps {
  topic: ForumPost;
  forum: DispatchForum;
  participatingModerators: PublicKey[] | null;
  isGated: boolean;
}

function TopicHeader(props: TopicHeaderProps): JSX.Element {
  const { isGated, topic, forum, participatingModerators } = props;

  const postedAt = !isNil(topic)
    ? `${topic.data.ts.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })} at ${topic.data.ts.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: 'numeric',
    })}`
    : '-';

  const identity = getIdentity(topic.poster);

  return (
    <div className="topicHeader">
      <div className="topicTitle">
        <div className="posted">
          <div className="postedBy">
            <div className="icon">
              {(identity != null)
                ? (
                <img
                  src={identity.profilePicture.href}
                  style={{ borderRadius: '50%' }}
                />
                )
                : (
                <Jdenticon value={topic.poster.toBase58()} alt="posterID" />
                )}
            </div>
            <div className="posterId">
              {(identity != null) ? identity.displayName : topic.poster.toBase58()}
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
            <AccountInfoLink href={`https://solscan.io/account/${topic.address.toBase58()}?cluster=${forum.cluster}`} />
          </div>
        </div>
        {!isEditedPost(topic)
          ? (
          <div className="subj">
            {isGated && (
              <div className="gatedTopic">
                <Lock />
              </div>
            )}
            <Markdown>{topic?.data.subj ?? 'subject'}</Markdown>
          </div>
          )
          : (
          <Spinner />
          )}
      </div>
      {!isEditedPost(topic) && (
        <div className="topicBody">
          <Markdown>{topic?.data.body ?? 'body of the topic'}</Markdown>
        </div>
      )}
    </div>
  );
}

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

export function TopicContent(props: TopicContentProps): JSX.Element {
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

  if (process.env.REACT_APP_DEBUG_MODE === 'true') {
    console.log('dsp', topic.address.toBase58());
  }

  const { buildForumPath } = usePath();
  const forumPath = buildForumPath(forumData.collectionId.toBase58());
  const restrictionSetting = topic.settings.find(setting => {
    return setting.postRestriction;
  });

  const currentForumAccessToken = useMemo(() => {
    if (isNil(restrictionSetting) || isNil(restrictionSetting.postRestriction)) {
      return [] as string[];
    } else {
      const postRestriction: PostRestriction = restrictionSetting.postRestriction.postRestriction;
      return restrictionListToString(postRestriction);
    }
  }, []);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(false);

  const [isNotificationHidden, setIsNotificationHidden] = useState(true);
  const permission = forum.permission;
  const [notificationContent, setNotificationContent] = useState<{
    content: string | ReactNode;
    type: MessageType;
  }>();

  const userIsMod = userRoles.includes(UserRoleType.Moderator);
  const forumIdentity = useForumIdentity(forumData.collectionId);

  const [showAddAccessToken, setShowAddAccessToken] = useState(false);

  // TODO Add config access token for topic
  // const [accessToken, setAccessToken] = useState<string>('');
  // const [addingAccessToken, setAddingAccessToken] = useState(false);

  const [showGiveAward, setShowGiveAward] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type?: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
  } | null>(null);

  /**
   * Whether a post is currently being created.
   * This allows us to lock the UI to stop a user from posting
   * again
   */
  const [postInFlight, setPostInFlight] = useState(false);

  const onDeleteTopic = async (): Promise<void> => {
    setDeletingTopic(true);
    const tx = await forum.deleteForumPost(
      topic,
      forumData.collectionId,
      userRoles.includes(UserRoleType.Moderator),
    );

    setShowDeleteConfirmation(false);
    setModalInfo({
      title: 'Confirming',
      body: (
        <div>
          The topic is being deleted and you will be redirected back to the forum
        </div>
      ),
    });

    if (isSuccess(tx)) {
      await forum.connection.confirmTransaction(tx);
      setModalInfo({
        title: 'Success!',
        type: MessageType.success,
        body: (
          <div>
            Topic deleted
          </div>
        ),
      });
      location.assign(`${forumPath}${location.search}`);
    } else {
      const error = tx;
      setDeletingTopic(false);
      setShowDeleteConfirmation(false);
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The topic could not be deleted',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
    }
  };

  return (
    <>
      {!isNil(modalInfo) && (
        <PopUpModal
          id="topic-info"
          visible
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={modalInfo.body}
          loading={deletingTopic}
          collapsible={modalInfo.collapsible}
          okButton={
            <button className="okButton" onClick={() => setModalInfo(null)}>
              OK
            </button>
          }
          onClose={() => setModalInfo(null)}
        />
      )}
      {ReactGA.send('pageview')}
      {showAddAccessToken && isNil(modalInfo) && (
        <PopUpModal
          id="add-access-token"
          visible
          title="Limit post access"
          body={
            <div >
              <label className="addModeratorsLabel">
                Current NFT Collection IDs
              </label>
              {currentForumAccessToken.length === 0 && (
                <div className="noRestriction">
                  The topic has no restriction
                </div>
              )}
              {currentForumAccessToken.map((token) => {
                return <div key={token} className="currentAccessToken">{token}</div>;
              })}
            </div>
          }
          onClose={() => setShowAddAccessToken(false)}
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
          onSuccess={notification => {
            setShowGiveAward(false);
            setIsNotificationHidden(false);
            setNotificationContent({
              content: notification,
              type: MessageType.success,
            });
            setTimeout(
              () => setIsNotificationHidden(true),
              NOTIFICATION_BANNER_TIMEOUT,
            );
          }}
          onError={error => {
            setShowGiveAward(false);
            setModalInfo({
              title: 'Something went wrong!',
              type: MessageType.error,
              body: 'The award could not be given.',
              collapsible: { header: 'Error', content: error?.message },
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
              onDownVotePost={async () =>
                forum.voteDownForumPost(topic, forumData.collectionId)
              }
              onUpVotePost={async () =>
                forum.voteUpForumPost(topic, forumData.collectionId)
              }
              post={topic}
              updateVotes={upVoted => updateVotes(upVoted)}
              direction='vertical'
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
          <div className="topicToolsContainer">
            <div className="topicTools">
              <PermissionsGate
                scopes={[SCOPES.canDeleteTopic]}
                posterKey={topic.poster}
              >
                <button
                  className="moderatorTool"
                  disabled={!permission.readAndWrite}
                  onClick={() => setShowDeleteConfirmation(true)}
                >
                  <div className="delete">
                    <Trash />
                  </div>
                </button>
                <div className="actionDivider" />
              </PermissionsGate>
              <EditPost
                post={topic}
                forumData={forumData}
                update={async () => update()}
                editPostLocal={editPost}
                showDividers={{ leftDivider: false, rightDivider: true }}
              />
              <div className="lock">
                <Lock />
              </div>
              <button
                className="moderatorTool"
                disabled={!permission.readAndWrite}
                onClick={() => setShowAddAccessToken(true)}
              >
                <span>Manage post access</span>
                <div className="lock">
                  <Lock />
                </div>
              </button>
            </div>
            {
              (forumIdentity !== ForumIdentity.DegenerateApeAcademy ||
                userIsMod) &&
                !(forum.wallet.publicKey?.equals(topic.poster) as boolean) && (
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
              update={update}
              addPost={addPost}
              onReload={() => {}}
              setPostInFlight={setPostInFlight}
              forumData={forumData}
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
        userIsMod={userIsMod ?? false}
        onDeletePost={async tx => {
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
            NOTIFICATION_BANNER_TIMEOUT,
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
