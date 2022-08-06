import "./../../style.css";
import * as _ from "lodash";
import { useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";
import {
  useForumData,
  useModal
} from '../../utils/hooks';

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
  Loading,
  DispatchClientError
} from '../../types/loading';
import {
  isSuccess,
  isInitial,
  isPending,
  isDispatchClientError,
  onChainAccountNotFound,
  pending
} from '../../utils/loading';

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
  const { modal, showModal, setModals } = useModal();
  const { collectionId, topicId } = props;
  const collectionPublicKey = useMemo(() => {
    // TODO show modal if this fails
    return new web3.PublicKey(collectionId);
  }, [collectionId]);

  const { forumData, update } = useForumData(collectionPublicKey, forum);

  const topic: Loading<ForumPost> = useMemo(() => {
    if (isSuccess(forumData)) {
      const post = forumData.posts.find(({ isTopic, postId }) => {
        return isTopic && postId === topicId;
      });
      if (post) {
        return post;
      } else {
        return onChainAccountNotFound();
      }
    } else {
      if (isPending(forumData)) {
        return pending();
      } else {
        return { loadingState: forumData.loadingState };
      }
    }
  }, [forumData, topicId]);

  useEffect(() => {
    // When forumData is updated, find all errors associated with
    // it and show them in the modal
    if (isSuccess(forumData)) {
      // Filter out all loading components that failed
      const errors = [
        forumData.owners,
        forumData.moderators
      ].filter(loading =>
        isDispatchClientError(loading)
      ) as DispatchClientError[];

      setModals(errors.map(({ error }) => {
        const message = JSON.stringify(error || {});
        return {
          type: MessageType.error,
          title: `Error loading ${error?.name || 'data'}`,
          collapsible: { header: 'Error', content: message }
        };
      }));
    }
  }, [forumData]);

  const { buildForumPath } = usePath();
  const forumPath = buildForumPath(collectionId);

  const updateVotes = (upVoted: boolean) => {
    if (isSuccess(topic)) {
      if (upVoted) {
        topic.upVotes += 1;
      } else {
        topic.downVotes += 1;
      }
    } else {
      // If necessary, handle behavior if topic isn't loaded here
    }
  };

  useEffect(() => {
    update();
    // Update every time the cluster is changed
  }, [forum.cluster]);

  useEffect(() => {
    if (
      !_.isNil(collectionPublicKey) &&
      !_.isNil(topic) &&
      forum.wallet.publicKey &&
      isSuccess(topic)
    ) {
      getUserRole(forum, collectionPublicKey, role, topic);
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
        {modal}
        {!permission.readAndWrite && <ConnectionAlert />}
        <div className="topicViewContainer">
          <div className="topicViewContent">
            <main>
              <div>
                {(() => {
                  if (
                    isInitial(topic) ||
                    isPending(topic)
                  ) {
                    return (
                      <div className="topicViewLoading">
                        <Spinner />
                      </div>
                    );
                  } else if (
                    isSuccess(forumData) &&
                    isSuccess(topic)
                  ) {
                    return (
                      <>
                        <title>{topic.data.subj!}</title>
                        <meta
                          name="description"
                          content={forumData.description.title}
                        />
                        <Breadcrumb
                          navigateTo={forumPath}
                          parent={forumData.description.title}
                          current={topic.data.subj!}
                        />
                        <TopicContent
                          forumData={forumData}
                          forum={forum}
                          topic={topic}
                          userRole={role.role}
                          update={update}
                          updateVotes={(upVoted) => updateVotes(upVoted)}
                        />
                      </>
                    );
                  } else {
                    return disconnectedView;
                  }
                })()}
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
