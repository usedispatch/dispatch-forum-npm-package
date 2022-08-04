import "./../../style.css";
import {isNil} from "../../utils/misc";

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

import { useForum, usePath, useRole } from "./../../contexts/DispatchProvider";
import { getUserRole } from "./../../utils/postbox/userRole";
interface Props {
  topicId: number;
  collectionId: string;
}

export const TopicView = (props: Props) => {
  const Forum = useForum();
  const Role = useRole();
  const { isNotEmpty, permission } = Forum;
  const { collectionId, topicId } = props;

  const [collectionPublicKey, setCollectionPublicKey] = useState<any>();

  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<ForumPost | null | undefined>();

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const { buildForumPath } = usePath();
  const forumPath = buildForumPath(collectionId);
  const [parent, setParent] = useState<string | undefined>();

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

  const getTopicData = async () => {
    setLoading(true);
    try {
      const [desc, res] = await Promise.all([
        Forum.getDescription(collectionPublicKey),
        Forum.getTopicData(topicId, collectionPublicKey),
      ]);
      setParent(desc?.title);
      setTopic(res);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "The topic could not be loaded",
        collapsible: { header: "Error", content: error.message },
      });

      setLoading(false);
      setTopic(null);
    }
  };

  const updateVotes = (upVoted: boolean) => {
    if (upVoted) {
      topic!.upVotes = topic!.upVotes + 1;
    } else {
      topic!.downVotes = topic!.downVotes + 1;
    }
  };

  useEffect(() => {
    if (isNotEmpty && !isNil(topicId) && !isNil(collectionPublicKey)) {
      getTopicData();
    } else {
      setLoading(false);
    }
  }, [isNotEmpty, topicId, collectionPublicKey, Forum]);

  useEffect(() => {
    if (
      !isNil(collectionPublicKey) &&
      !isNil(topic) &&
      Forum.wallet.publicKey
    ) {
      getUserRole(Forum, collectionPublicKey, Role, topic);
    }
  }, [collectionPublicKey, topic, Forum.wallet.publicKey]);

  const disconnectedView = (
    <div className="disconnectedTopicView">
      {`The topic with id ${topicId} does not exist`}
    </div>
  );

  return (
    <div className="dsp- ">
      <div className="topicView">
        {!isNil(modalInfo) && (
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
                {loading ? (
                  <div className="topicViewLoading">
                    <Spinner />
                  </div>
                ) : topic ? (
                  <>
                    <Breadcrumb
                      navigateTo={forumPath}
                      parent={parent!}
                      current={topic?.data.subj!}
                    />
                    <TopicContent
                      topic={topic}
                      forum={Forum}
                      collectionId={collectionPublicKey}
                      userRole={Role.role}
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
