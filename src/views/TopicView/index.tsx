import "./../../style.css";
import * as _ from "lodash";
import { useState, useEffect, ReactNode, useCallback, useContext } from "react";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Chevron } from "../../assets";
import {
  PopUpModal,
  MessageType,
  Spinner,
  CollapsibleProps,
} from "../../components/common";
import {
  ConnectionAlert,
  PoweredByDispatch,
  TopicContent,
} from "../../components/forums";

import { userRole, UserRoleType } from "../../utils/postbox/userRole";
import { useForum, usePath } from "./../../contexts/DispatchProvider";

interface Props {
  topicId: number;
  collectionId: string;
}

export const TopicView = (props: Props) => {
  const Forum = useForum();
  const connected = Forum.isNotEmpty;
  const permission = Forum.permission;
  const { collectionId, topicId } = props;
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<ForumPost>();
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const [role, setRole] = useState<UserRoleType | null>(null);

  const { buildForumPath } = usePath();
  const forumPath = buildForumPath(collectionId);
  const [parent, setParent] = useState<string | undefined>();

  const [collectionPublicKey, setCollectionPublicKey] = useState<any>();

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

  const getUserRole = useCallback(async () => {
    try {
      const role = await userRole(Forum, collectionPublicKey);
      setRole(role);
    } catch (error) {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "Your user role could not be determined, you will only have permission to create topics and comment",
        collapsible: { header: "Error", content: error },
      });
    }
  }, [Forum, collectionPublicKey]);

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
    } catch (error) {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "The topic could not be loaded",
        collapsible: { header: "Error", content: error },
      });

      setLoading(false);
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
    if (connected && !_.isNil(topicId) && !_.isNil(collectionPublicKey)) {
      getTopicData();
    } else {
      setLoading(false);
    }
  }, [connected, topicId, collectionPublicKey]);

  useEffect(() => {
    if (connected && !_.isNil(collectionPublicKey) && !_.isNil(topic)) {
      const localStorageRole = localStorage.getItem("role");
      if (_.isNil(localStorageRole)) {
        getUserRole();
      } else {
        setRole(localStorageRole as UserRoleType);
      }
    } else {
      localStorage.removeItem("role");
    }
  }, [connected, collectionPublicKey, topic]);

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
              {loading ? (
                <div className="topicViewLoading">
                  <Spinner />
                </div>
              ) : topic ? (
                <>
                  <Breadcrumb
                    navigateTo={forumPath}
                    parent={parent!}
                    current={topic.data.subj!}
                  />
                  <TopicContent
                    topic={topic}
                    forum={Forum}
                    collectionId={collectionPublicKey}
                    userRole={role ?? UserRoleType.Poster}
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
      <a href={navigateTo}>
        <div className="parent">{parent}</div>
      </a>
      <div className="separationIcon">
        <Chevron />
      </div>
      <div className="current">{current}</div>
    </div>
  );
}
