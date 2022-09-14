import "./../../style.css";
import * as _ from "lodash";
import Markdown from "markdown-to-jsx";
import { useEffect, useMemo } from "react";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";
import { Helmet } from "react-helmet";

import {
  useForumData,
  useModal,
  useParticipatingModerators,
  isForumPost,
  isEditedPost,
  EditedPost,
} from "../../utils/hooks";

import { Chevron } from "../../assets";
import { MessageType, Spinner, Link } from "../../components/common";
import {
  ConnectionAlert,
  PoweredByDispatch,
  TopicContent,
} from "../../components/forums";
import { Loading, DispatchClientError } from "../../types/loading";
import {
  isSuccess,
  isInitial,
  isPending,
  isDispatchClientError,
  onChainAccountNotFound,
  pending,
} from "../../utils/loading";

import { useForum, usePath, useRole } from "./../../contexts/DispatchProvider";
import { getUserRole } from "./../../utils/postbox/userRole";
import { getCustomStyles } from "../../utils/getCustomStyles";
import { StarsAlert } from "../../components/forums/StarsAlert";

interface Props {
  topicId: number;
  collectionId: string;
}

export const TopicView = (props: Props) => {
  const forum = useForum();
  const role = useRole();
  const { permission } = forum;
  const { modal, showModal, setModals } = useModal();
  const { collectionId, topicId } = props;
  const collectionPublicKey: web3.PublicKey | null = useMemo(() => {
    try {
      // TODO show modal if this fails
      return new web3.PublicKey(collectionId);
    } catch (error) {
      showModal({
        type: MessageType.error,
        title: "Invalid Collection ID",
      });
      return null;
    }
  }, [collectionId]);

  const { forumData, update, addPost, editPost, deletePost } = useForumData(
    collectionPublicKey,
    forum
  );
  const participatingModerators = useParticipatingModerators(forumData, forum);

  const topic: Loading<ForumPost | EditedPost> = useMemo(() => {
    if (isSuccess(forumData)) {
      const post = forumData.posts.find((post) => {
        // This conditional only evaluates to true if `post` is a
        // ForumPost and not a LocalPost-- that is, if it exists
        // on-chain
        if ("postId" in post) {
          return (
            (isForumPost(post) || isEditedPost(post)) &&
            post.isTopic &&
            post.postId === topicId
          );
        } else {
          return false;
        }
        // The above function only returns true if the post in
        // question is a ForumPost or an EditedPost. But the
        // TypeScript checker can't recognize that, so we cast
        // here
      }) as ForumPost | EditedPost;
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
      const errors = [forumData.owners].filter((loading) =>
        isDispatchClientError(loading)
      ) as DispatchClientError[];

      setModals(
        errors.map(({ error }) => {
          const message = JSON.stringify(error || {});
          return {
            type: MessageType.error,
            title: `Error loading ${error?.name || "data"}`,
            collapsible: { header: "Error", content: message },
          };
        })
      );
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

  const invalidPublicKeyView = (
    <div className="disconnectedTopicView">
      {`${collectionId} is not a valid Collection ID`}
    </div>
  );

  const disconnectedView = (
    <div className="disconnectedTopicView">
      {`The topic with id ${topicId} does not exist`}
    </div>
  );

  const customStyle = getCustomStyles(collectionId);

  return (
    <div className="dsp- ">
      <div className={customStyle}>
        <Helmet>
          <meta charSet="utf-8" />
          {isSuccess(topic) && <title>{topic.data.subj} -- Topic </title>}
        </Helmet>
        <div className="topicView">
          {modal}
          {!permission.readAndWrite && <ConnectionAlert />}
          {collectionId === "DSwfRF1jhhu6HpSuzaig1G19kzP73PfLZBPLofkw6fLD" && <StarsAlert/>}
          <div className="topicViewContainer">
            <div className="topicViewContent">
              <main>
                <div>
                  {(() => {
                    if (
                      (collectionPublicKey && isInitial(topic)) ||
                      isPending(topic)
                    ) {
                      return (
                        <div className="topicViewLoading">
                          <Spinner />
                        </div>
                      );
                    } else if (
                      collectionPublicKey &&
                      isSuccess(forumData) &&
                      isSuccess(topic)
                    ) {
                      return (
                        <>
                          <Breadcrumb
                            navigateTo={forumPath}
                            parent={forumData.description.title}
                            current={topic.data.subj!}
                          />
                          <TopicContent
                            forumData={forumData}
                            participatingModerators={participatingModerators}
                            forum={forum}
                            topic={topic}
                            userRoles={role.roles}
                            update={update}
                            addPost={addPost}
                            editPost={editPost}
                            deletePost={deletePost}
                            updateVotes={(upVoted) => updateVotes(upVoted)}
                          />
                        </>
                      );
                    } else if (_.isNull(collectionPublicKey)) {
                      return invalidPublicKeyView;
                    } else {
                      // TODO(andrew) more sophisticated error
                      // handling here
                      return disconnectedView;
                    }
                  })()}
                </div>
              </main>
            </div>
          </div>
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
      <Link className="parent" href={navigateTo}>
        <Markdown>{parent}</Markdown>
      </Link>
      <div className="separationIcon">
        <Chevron />
      </div>
      <div className="current">
        <Markdown>{current}</Markdown>
      </div>
    </div>
  );
}
