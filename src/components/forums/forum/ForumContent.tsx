import * as _ from "lodash";
import { useState, useEffect, ReactNode, useContext } from "react";
import Jdenticon from "react-jdenticon";
import * as web3 from "@solana/web3.js";

import { ForumInfo, ForumPost, IForum } from "@usedispatch/client";

import { Plus } from "../../../assets";
import { MessageType, PopUpModal, Spinner } from "../../common";
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
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [showAddModerators, setShowAddModerators] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moderators, setModerators] = useState<string>("");
  const [addingNewModerators, setAddingNewModerators] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
  } | null>(null);

  const [topics, setTopics] = useState<ForumPost[]>([]);

  const addModerators = async () => {
    setAddingNewModerators(true);
    try {
      const moderatorsIds = moderators
        .split(",")
        .map((m) => new web3.PublicKey(m));

      const p = moderatorsIds.map(async (t) => {
        return Forum.addModerator(t, forum.collectionId);
      });
      const mods = await Promise.all(p);
      onAddModerators();
      setModerators("");
      setShowAddModerators(false);
      setAddingNewModerators(false);
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: `The moderators were added`,
      });
    } catch (error) {
      setModerators("");
      setAddingNewModerators(false);
      setShowAddModerators(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The moderators could not be added`,
      });
    }
  };

  const getTopicsForForum = async () => {
    try {
      setLoadingTopics(true);
      const topics = await Forum.getTopicsForForum(forum.collectionId);
      setTopics(topics ?? []);
      setLoadingTopics(false);
    } catch (error) {
      setLoadingTopics(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The topics for the forum could not be loaded`,
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
      });
    }
  };

  const createTopicButton = (
    <button
      className={"createTopicButton"}
      type="button"
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
        {/* <Image src={plus} height={14} width={14} alt="plus" /> */}
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
    getTopicsForForum();
  }, [forum]);

  return (
    <div className="forumContent">
      {modalInfo !== null && !showNewTopicModal && (
        <PopUpModal
          id="create-topic-info"
          visible
          title={modalInfo?.title}
          messageType={modalInfo?.type}
          body={modalInfo?.body}
          okButton={
            <a className="okButton" onClick={() => setModalInfo(null)}>
              OK
            </a>
          }
        />
      )}
      {showNewTopicModal && modalInfo === null && (
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
              type="submit"
              className="okButton"
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
              {addingNewModerators ? (
                <Spinner />
              ) : (
                <>
                  <label className="addModeratorsLabel">Add new</label>
                  <input
                    placeholder="Add moderators' wallet ID here, separated by commas"
                    className="addModeratorsInput"
                    maxLength={800}
                    value={moderators}
                    onChange={(e) => setModerators(e.target.value)}
                  />
                  <label className="addModeratorsLabel">
                    Current moderators
                  </label>
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
                </>
              )}
            </div>
          }
          okButton={
            !addingNewModerators && (
              <button className="okButton" onClick={() => addModerators()}>
                Save
              </button>
            )
          }
          cancelButton={
            !addingNewModerators && (
              <button
                className="cancelButton"
                onClick={() => {
                  setShowAddModerators(false);
                  setModerators("");
                }}>
                Cancel
              </button>
            )
          }
        />
      )}
      {forumHeader}
      {role === UserRoleType.Owner && (
        <button
          className="manageModerators"
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
  );
}
