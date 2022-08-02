import "./../../style.css";
import * as _ from "lodash";
import { useState, useEffect, ReactNode, useCallback } from "react";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Chevron } from "../../assets";
import {
  PopUpModal,
  MessageType,
  Spinner,
  CollapsibleProps,
  Link,
} from "../../components/common";
import {
  ConnectionAlert,
  PoweredByDispatch,
  TopicContent,
} from "../../components/forums";
import {
  Loading
} from '../../types/loading';

import { useForum, usePath, useRole } from "./../../contexts/DispatchProvider";
import { getUserRole } from "./../../utils/postbox/userRole";
interface Props {
  topicId: number;
  collectionId: string;
}

export const TopicView = (props: Props) => {
  const forum = useForum();
  const role = useRole();
  const { isNotEmpty, permission } = forum;
  const { collectionId, topicId } = props;

  const [collectionPublicKey, setCollectionPublicKey] = useState<web3.PublicKey | null>(null);

  const [topic, setTopic] = useState<Loading<ForumPost>>(
    { state: 'initial' }
  );

  const [posts, setPosts] = useState<Loading<ForumPost[]>>(
    { state: 'initial' }
  );

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const { buildForumPath } = usePath();
  const forumPath = buildForumPath(collectionId);
  const [parent, setParent] = useState<Loading<string | undefined>>(
    { state: 'initial' }
  );

  useEffect(() => {
    try {
      const collectionIdKey = new web3.PublicKey(collectionId);
      setCollectionPublicKey(collectionIdKey);
    } catch {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "Invalid Public Key",
      });
    }
  }, []);

  const refresh = async () => {
    setParent({ state: 'pending' });
    setTopic({ state: 'pending' });
    try {
      const [desc, res, ps] = await Promise.all([
        // TODO consider gracefully handling null instead of
        // using nonnull asserts
        forum.getDescription(collectionPublicKey!),
        forum.getTopicData(topicId, collectionPublicKey!),
        forum.getPostsForForum(collectionPublicKey!)
      ]);
      setParent({ state: 'success', value: desc?.title });
      setTopic({ state: 'success', value: res });
      setPosts({ state: 'success', value: ps! });
    } catch (error: any) {
      console.log(error);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "The topic could not be loaded",
        collapsible: { header: "Error", content: error.message },
      });

      setTopic({ state: 'failed' });
      setParent({ state: 'failed' });
    }
  };

  const updateVotes = (upVoted: boolean) => {
    if (topic.state === 'success' && topic.value) {
      const { value } = topic;
      if (upVoted) {
        value.upVotes += 1;
      } else {
        value.downVotes += 1;
      }
    } else {
      // If necessary, handle behavior if topic isn't loaded here
    }
  };

  useEffect(() => {
    if (isNotEmpty && !_.isNil(topicId) && !_.isNil(collectionPublicKey)) {
      refresh();
    } else {
      // Consider having special 'not found' Loading state?
      setTopic({ state: 'failed' });
    }
  }, [isNotEmpty, topicId, collectionPublicKey, forum]);

  useEffect(() => {
    if (
      !_.isNil(collectionPublicKey) &&
      !_.isNil(topic) &&
      forum.wallet.publicKey &&
      topic.state === 'success' &&
      topic.value
    ) {
      getUserRole(forum, collectionPublicKey, role, topic.value);
    }
  }, [collectionPublicKey, topic, forum.wallet.publicKey]);

  const disconnectedView = (
    <div className="disconnectedTopicView">
      {`The topic with id ${topicId} does not exist`}
    </div>
  );

  return (
    <div className="dsp- ">
      <div className="topicView">
        {!_.isNil(modalInfo) && (
          <PopUpModal
            id="topic-info"
            visible
            title={modalInfo.title}
            messageType={modalInfo.type}
            body={modalInfo.body}
            collapsible={modalInfo.collapsible}
            okButton={
              <a className="okInfoButton" onClick={() => setModalInfo(null)}>
                OK
              </a>
            }
          />
        )}
        {!permission.readAndWrite && <ConnectionAlert />}
        <div className="topicViewContainer">
          <div className="topicViewContent">
            <main>
              <div>
                {topic.state === 'pending' ? (
                  <div className="topicViewLoading">
                    <Spinner />
                  </div>
                ) : topic.state === 'success' &&
                  parent.state === 'success' &&
                  posts.state === 'success'
                  ? (
                  <>
                    <Breadcrumb
                      navigateTo={forumPath}
                      parent={parent.value!}
                      current={topic.value.data.subj!}
                    />
                    <TopicContent
                      topic={topic.value}
                      posts={posts.value}
                      forum={forum}
                      collectionId={collectionPublicKey!}
                      userRole={role.role}
                      updateVotes={(upVoted) => updateVotes(upVoted)}
                    />
                  </>
                ) : (
                  disconnectedView
                )}
              </div>
            </main>
          </div>
          <PoweredByDispatch />
        </div>
      </div>
    </div>
  );
};

interface BreadcrumbProps {
  navigateTo: string;
  parent: string;
  current: string;
}

function Breadcrumb(props: BreadcrumbProps) {
  const { navigateTo, current, parent } = props;

  return (
    <div className="breadcrumbContainer">
      <Link className="test" href={navigateTo}>
        <div className="parent">{parent}</div>
      </Link>
      <div className="separationIcon">
        <Chevron />
      </div>
      <div className="current">{current}</div>
    </div>
  );
}
