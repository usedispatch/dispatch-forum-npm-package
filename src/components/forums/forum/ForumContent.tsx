import * as _ from "lodash";
import { useState, useEffect, ReactNode, useContext, useRef } from "react";
import Jdenticon from "react-jdenticon";
import * as web3 from "@solana/web3.js";

import { ForumInfo, ForumPost, IForum } from "@usedispatch/client";

import { Plus } from "../../../assets";
import { CollapsibleProps, MessageType, PopUpModal } from "../../common";
import { TopicList } from "..";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { UserRoleType } from "../../../utils/postbox/userRole";
import { ForumContext } from "../../../contexts/DispatchProvider";

interface ForumContentProps {
  forum: ForumInfo;
  onAddModerators: () => void;
  forumObject?: DispatchForum;
  role?: UserRoleType;
}

export function ForumContent(props: ForumContentProps) {
  const { forum, role, onAddModerators } = props;
  const Forum = useContext(ForumContext);
  const connected = Forum.isNotEmpty;
  const permission = Forum.permission;
  const mount = useRef(false);
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [showAddModerators, setShowAddModerators] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newModerator, setNewModerator] = useState<string>("");
  const [addingNewModerator, setAddingNewModerator] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const [topics, setTopics] = useState<ForumPost[]>([]);

  const addModerators = async () => {
    try {
      const moderatorId = new web3.PublicKey(newModerator);
      await Forum.addModerator(moderatorId, forum.collectionId);

      onAddModerators();
      setNewModerator("");
      setShowAddModerators(false);
      setAddingNewModerator(false);
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: `The moderator was added`,
      });
    } catch (error) {
      setNewModerator("");
      setAddingNewModerator(false);
      setShowAddModerators(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The moderator could not be added`,
        collapsible: { header: "Error", content: error },
      });
    }
  };

  const getTopicsForForum = async () => {
    try {
      setLoadingTopics(true);
      const topics = await Forum.getTopicsForForum(forum.collectionId);
      if (mount.current) {
        setTopics(topics ?? []);
        setLoadingTopics(false);
      }
    } catch (error) {
      setLoadingTopics(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The topics for the forum could not be loaded`,
        collapsible: { header: "Error", content: error },
      });
    }
  };

  const createTopic = async () => {
    const p = {
      subj: title,
      body: description,
    };

    try {
      const tx = await Forum.createTopic(p, forum.collectionId);
      if (!_.isNil(tx)) {
        getTopicsForForum();
        setModalInfo({
          body: "The new topic was created",
          type: MessageType.success,
          title: "Success!",
        });
      } else {
        setLoadingTopics(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The topic could not be created`,
        });
      }
    } catch (error) {
      setLoadingTopics(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The topic could not be created`,
        collapsible: { header: "Error", content: error },
      });
    }
  };

  const createTopicButton = (
    <button
      className={"createTopicButton"}
      type="button"
      disabled={!permission.readAndWrite}
      onClick={() => {
        if (connected) {
          setShowNewTopicModal(true);
        } else {
          setModalInfo({
            title: "Something went wrong",
            type: MessageType.warning,
            body: "Connect to your wallet in order to create a forum",
          });
        }
      }}>
      <div className="buttonImageContainer">
        <Plus />
      </div>
      Create Topic
    </button>
  );

  const forumHeader = (
    <div className="forumContentHeader">
      <div className="box">
        <div className="description">{forum.description}</div>
        {createTopicButton}
      </div>
    </div>
  );

  useEffect(() => {
    mount.current = true;
    getTopicsForForum();
    return () => {
      mount.current = false;
    };
  }, [forum]);

  return (
    <div className="dsp- ">
    <div className="forumContent">
      {!_.isNil(modalInfo) && !showNewTopicModal && (
        <PopUpModal
          id="create-topic-info"
          visible
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={modalInfo.body}
          collapsible={modalInfo.collapsible}
          okButton={
            <a className="okButton" onClick={() => setModalInfo(null)}>
              OK
            </a>
          }
        />
      )}
      {showNewTopicModal && _.isNil(modalInfo) && (
        <PopUpModal
          id="create-topic"
          visible
          title={"Create new Topic"}
          body={
            <div className="createTopicBody">
              <>
                <span className="createTopicLabel">Topic Title</span>
                <input
                  type="text"
                  placeholder="Title"
                  className="createTopicTitleInput"
                  name="name"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </>
              <>
                <span className="createTopicLabel">Topic Description</span>
                <textarea
                  placeholder="Description"
                  className="createTopicTitleInput createTopicTextArea"
                  maxLength={800}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </>
            </div>
          }
          okButton={
            <button
              className="okButton"
              disabled={title.length === 0}
              onClick={() => {
                setShowNewTopicModal(false);
                setLoadingTopics(true);
                createTopic();
              }}>
              Create
            </button>
          }
          cancelButton={
            <div
              className="cancelButton"
              onClick={() => setShowNewTopicModal(false)}>
              Cancel
            </div>
          }
        />
      )}
      {_.isNil(modalInfo) && showAddModerators && (
        <PopUpModal
          id="add-moderators"
          visible
          title={"Manage moderators"}
          body={
            <div className="addModeratorsBody">
              <label className="addModeratorsLabel">Add new</label>
              <input
                placeholder="Add moderators' wallet ID here"
                className="addModeratorsInput"
                maxLength={800}
                value={newModerator}
                onChange={(e) => setNewModerator(e.target.value)}
              />
              <label className="addModeratorsLabel">Current moderators</label>
              <ul>
                {forum?.moderators.map((m) => {
                  const key = m.toBase58();
                  return (
                    <li key={key} className="currentModerators">
                      <div className="iconContainer">
                        <Jdenticon value={key} alt="moderatorId" />
                      </div>
                      {key}
                    </li>
                  );
                })}
              </ul>
            </div>
          }
          loading={addingNewModerator}
          okButton={
            !addingNewModerator && (
              <button className="okButton" onClick={() => addModerators()}>
                Save
              </button>
            )
          }
          cancelButton={
            !addingNewModerator && (
              <button
                className="cancelButton"
                onClick={() => {
                  setShowAddModerators(false);
                  setNewModerator("");
                }}>
                Cancel
              </button>
            )
          }
        />
      )}
      {forumHeader}
      {(role === UserRoleType.Owner || role == UserRoleType.Moderator) && (
        <button
          className="manageModerators"
          disabled={!permission.readAndWrite}
          onClick={() => setShowAddModerators(true)}>
          Manage moderators
        </button>
      )}
      <TopicList
        loading={loadingTopics}
        topics={topics}
        collectionId={forum.collectionId}
      />
    </div>
    </div>
  );
}
