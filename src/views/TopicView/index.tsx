import "./../../style.css";
import * as _ from "lodash";
import { useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";
import { useForumData } from '../../utils/hooks';

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
  const collectionPublicKey = useMemo(() => {
    // TODO show modal if this fails
    return new web3.PublicKey(collectionId);
  }, [collectionId]);

  const { forumData, update } = useForumData(collectionPublicKey, forum);

  const topic: Loading<ForumPost> = useMemo(() => {
    if (forumData.state === 'success') {
      const post = forumData.value.posts.find(({ isTopic, postId }) => {
        return isTopic && postId === topicId
      });
      if (post) {
        return {
          state: 'success',
          value: post
        }
      } else {
          return { state: 'notFound' };
        }
    } else {
      return forumData;
    }
  }, [forumData, topicId]);


  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const { buildForumPath } = usePath();
  const forumPath = buildForumPath(collectionId);

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
    update();
  }, []);

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
                ) : forumData.state === 'success' &&
                    topic.state === 'success'
                  ? (
                  <>
                    <Breadcrumb
                      navigateTo={forumPath}
                      parent={forumData.value.info.title}
                      current={topic.value!.data.subj!}
                    />
                    <TopicContent
                      forumData={forumData.value}
                      forum={forum}
                      topic={topic.value}
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
