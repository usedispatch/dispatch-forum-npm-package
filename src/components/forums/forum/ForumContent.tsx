import * as _ from "lodash";
import { useState, ReactNode, useEffect } from "react";
import Jdenticon from "react-jdenticon";
import { PostRestriction } from "@usedispatch/client";

import { Lock, Plus, Trash } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PermissionsGate,
  PopUpModal,
  TransactionLink,
} from "../../common";
import { EditForum } from "./EditForum";
import { TopicList } from "..";
import { useRole } from "../../../contexts/DispatchProvider";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { newPublicKey } from "../../../utils/postbox/validateNewPublicKey";
import { SCOPES, UserRoleType } from "../../../utils/permissions";
import { isSuccess } from "../../../utils/loading";
import { ForumData } from "../../../utils/hooks";
import {
  restrictionListToString,
  pubkeysToRestriction,
} from "../../../utils/restrictionListHelper";
interface ForumContentProps {
  forumObject: DispatchForum;
  forumData: ForumData;
  update: () => Promise<void>;
}

export function ForumContent(props: ForumContentProps) {
  const { forumData, forumObject, update } = props;
  const { role } = useRole();
  const { permission } = forumObject;

  const [newTopic, setNewTopic] = useState<{
    title: string;
    description: string;
    accessToken: string;
  }>({ title: "", description: "", accessToken: "" });
  const [currentMods, setCurrentMods] = useState<string[]>(() => {
    if (isSuccess(forumData.moderators)) {
      return forumData.moderators.map((pkey) => pkey.toBase58());
    } else {
      // TODO(andrew) show error here for missing mods
      return [];
    }
  });
  const [currentOwners, setCurrentOwners] = useState<string[]>(() => {
    if (isSuccess(forumData.owners)) {
      return forumData.owners.map((pkey) => pkey.toBase58());
    } else {
      // TODO(andrew) show error here for missing owners
      return [];
    }
  });

  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [creatingNewTopic, setCreatingNewTopic] = useState(false);
  const [keepGates, setKeepGates] = useState(true);

  const [showAddModerators, setShowAddModerators] = useState(false);
  const [showAddOwners, setShowAddOwners] = useState(false);
  const [newModerator, setNewModerator] = useState<string>("");
  const [newOwner, setNewOwner] = useState<string>("");
  const [addingNewModerator, setAddingNewModerator] = useState(false);
  const [addingNewOwner, setAddingNewOwner] = useState(false);
  const [ungatedNewTopic, setUngatedNewTopic] = useState(false);
  const [showManageAccessToken, setShowManageAccessToken] = useState(false);
  const [removeAccessToken, setRemoveAccessToken] = useState<{
    show: boolean;
    removing: boolean;
    token?: string;
  }>({ show: false, removing: false });
  const [currentForumAccessToken, setCurrentForumAccessToken] = useState<
    string[]
  >(() => {
    if (isSuccess(forumData.restriction)) {
      return restrictionListToString(forumData.restriction);
    } else return [];
  });
  const [newForumAccessToken, setNewForumAccessToken] = useState<string>("");
  const [addingAccessToken, setAddingAccessToken] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
  } | null>(null);

  useEffect(() => {
    if (!keepGates && newTopic.accessToken.length === 0) {
      setUngatedNewTopic(true);
    } else {
      setUngatedNewTopic(false);
    }
  }, [newTopic.accessToken, keepGates]);

  // Begin mutating operations
  const addModerators = async () => {
    setAddingNewModerator(true);
    try {
      const moderatorId = newPublicKey(newModerator);
      const tx = await forumObject.addModerator(
        moderatorId,
        forumData.collectionId
      );
      setCurrentMods(currentMods.concat(newModerator));
      setNewModerator("");
      setShowAddModerators(false);
      setAddingNewModerator(false);
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: (
          <div className="successBody">
            <div>The moderator was added</div>
            <TransactionLink transaction={tx!} />
          </div>
        ),
      });
    } catch (error: any) {
      setAddingNewModerator(false);
      if (error.code !== 4001) {
        setNewModerator("");
        setShowAddModerators(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The moderators could not be added`,
          collapsible: { header: "Error", content: error.message },
        });
      }
    }
  };

  const addOwner = async () => {
    setAddingNewOwner(true);
    try {
      const ownerId = newPublicKey(newOwner);
      const tx = await forumObject.addOwner(ownerId, forumData.collectionId);
      setCurrentOwners(currentOwners.concat(newOwner));
      setNewOwner("");
      setShowAddOwners(false);
      setAddingNewOwner(false);
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: (
          <div className="successBody">
            <div>The owner was added</div>
            <TransactionLink transaction={tx!} />
          </div>
        ),
      });
    } catch (error: any) {
      setAddingNewOwner(false);
      if (error.code !== 4001) {
        setNewOwner("");
        setShowAddOwners(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The owners could not be added`,
          collapsible: { header: "Error", content: JSON.stringify(error) },
        });
      }
    }
  };

  const addAccessToken = async () => {
    setAddingAccessToken(true);
    try {
      const restriction = pubkeysToRestriction(
        newForumAccessToken,
        isSuccess(forumData.restriction) ? forumData.restriction : undefined
      );
      const currentIds = restrictionListToString(restriction);

      const tx = await forumObject.setForumPostRestriction(
        forumData.collectionId,
        restriction
      );

      setCurrentForumAccessToken(
        currentForumAccessToken.concat([newForumAccessToken])
      );
      setNewForumAccessToken("");
      setShowManageAccessToken(false);
      setAddingAccessToken(false);
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
      setCurrentForumAccessToken(currentIds);
    } catch (error: any) {
      setAddingAccessToken(false);
      if (error.code !== 4001) {
        setShowManageAccessToken(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The access token could not be added`,
          collapsible: { header: "Error", content: error.message },
        });
      }
    }
  };

  const deleteAccessToken = async () => {
    setRemoveAccessToken({ ...removeAccessToken, removing: true });
    try {
      const filteredTokens = currentForumAccessToken.filter(
        (t) => t != removeAccessToken.token
      );

      let tx = "";
      if (filteredTokens.length > 0) {
        const restrictionList = pubkeysToRestriction(filteredTokens.join(","));
        tx = await forumObject.setForumPostRestriction(
          forumData.collectionId,
          restrictionList
        );
      } else {
        tx = await forumObject.deleteForumPostRestriction(
          forumData.collectionId
        );
      }

      setCurrentForumAccessToken(filteredTokens);
      setRemoveAccessToken({ show: false, removing: false });

      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: (
          <div className="successBody">
            <div>The access token was removed.</div>
            <TransactionLink transaction={tx} />
          </div>
        ),
      });
    } catch (error: any) {
      setRemoveAccessToken({ show: false, removing: false });
      if (error?.error?.code !== 4001) {
        setShowManageAccessToken(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The access token could not be removed`,
          collapsible: { header: "Error", content: error.message },
        });
      }
    }
  };

  const createTopic = async () => {
    const p = {
      subj: newTopic.title,
      body: newTopic.description,
    };

    setCreatingNewTopic(true);
    try {
      let restriction;
      // First case checks if existing gates are kept and new ones being added
      // Second case removes existing gates and adds new ones
      // Third case removes existing gates
      // Final case keeps existing gates
      if (keepGates && newTopic.accessToken !== "") {
        restriction = pubkeysToRestriction(
          newTopic.accessToken,
          isSuccess(forumData.restriction) ? forumData.restriction : undefined
        );
      } else if (!keepGates && newTopic.accessToken !== "") {
        restriction = pubkeysToRestriction(newTopic.accessToken);
      } else if (!keepGates) {
        restriction = { null: {} };
      } else {
        restriction = undefined;
      }
      const tx = await forumObject.createTopic(
        p,
        forumData.collectionId,
        restriction
      );
      if (!_.isNil(tx)) {
        setCreatingNewTopic(false);
        setModalInfo({
          body: <TransactionLink transaction={tx} />,
          type: MessageType.success,
          title: "Topic created!",
        });
        setNewTopic({ title: "", description: "", accessToken: "" });
        setShowNewTopicModal(false);
        await forumObject.connection
          .confirmTransaction(tx)
          .then(() => update());
      } else {
        setCreatingNewTopic(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The topic could not be created`,
        });
        setShowNewTopicModal(false);
      }
    } catch (error: any) {
      setCreatingNewTopic(false);
      if (error?.code !== 4001) {
        setShowNewTopicModal(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The topic could not be created`,
          collapsible: { header: "Error", content: error.message },
        });
      } else {
        setShowNewTopicModal(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The topic could not be created`,
          collapsible: { header: "Error", content: error },
        });
      }
    }
  };

  const createTopicButton = (
    <button
      className={"createTopicButton"}
      type="button"
      disabled={!permission.readAndWrite}
      onClick={() => {
        setShowNewTopicModal(true);
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
        <div className="description">{forumData.description.desc}</div>
        {createTopicButton}
      </div>
    </div>
  );

  return (
    <div className="dsp- ">
      <div className="forumContent">
        {!_.isNil(modalInfo) && (
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
        {showManageAccessToken && _.isNil(modalInfo) && (
          <PopUpModal
            id="add-access-token"
            visible
            title="Limit forum access"
            body={
              <div className="addModeratorsBody">
                <label className="addModeratorsLabel">
                  Add new NFT Collection ID
                </label>
                You can enter one NFT Collection ID here such that only holders
                of NFT's in the collection can participate in this forum.
                <input
                  type="text"
                  placeholder="NFT Collection ID"
                  className="newAccessToken"
                  name="accessToken"
                  value={newForumAccessToken}
                  onChange={(e) => setNewForumAccessToken(e.target.value)}
                />
                <label className="addModeratorsLabel">
                  Current NFT Collection ID
                </label>
                {currentForumAccessToken.length === 0 ? (
                  <div className="noRestriction">
                    The forum has no restriction
                  </div>
                ) : (
                  currentForumAccessToken.map((token, index) => {
                    return (
                      <div className="currentToken" key={index}>
                        <>{token}</>
                        <div
                          onClick={() => {
                            setShowManageAccessToken(false);
                            setRemoveAccessToken({
                              ...removeAccessToken,
                              show: true,
                              token,
                            });
                          }}>
                          <Trash />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            }
            loading={addingAccessToken}
            onClose={() => {
              setShowManageAccessToken(false);
              setNewForumAccessToken("");
            }}
            okButton={
              <button className="okButton" onClick={() => addAccessToken()}>
                Save
              </button>
            }
          />
        )}
        {removeAccessToken.show && _.isNil(modalInfo) && (
          <PopUpModal
            id="remove-access-token"
            visible
            title="Are you sure you want to remove NFT Collection ID?"
            body={
              <div>
                This action will remove the token
                {` ${removeAccessToken.token?.substring(0, 4)}...`}
                {`${removeAccessToken.token?.slice(-4)} `} from gating the
                forum.
              </div>
            }
            loading={removeAccessToken.removing}
            onClose={() =>
              setRemoveAccessToken({ show: false, removing: false })
            }
            okButton={
              <button className="okButton" onClick={() => deleteAccessToken()}>
                Remove
              </button>
            }
          />
        )}
        {(() => {
          if (showNewTopicModal && _.isNil(modalInfo)) {
            if (role === UserRoleType.Viewer) {
              return (
                <PopUpModal
                  id="create-topic"
                  title="You are not authorized"
                  body={
                    "Oops! You need a token to participate. Please contact the forum’s moderators."
                  }
                  visible
                  okButton={
                    <button
                      className="okButton"
                      onClick={() => setShowNewTopicModal(false)}>
                      OK
                    </button>
                  }
                />
              );
            } else {
              return (
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
                          value={newTopic.title}
                          onChange={(e) =>
                            setNewTopic({ ...newTopic, title: e.target.value })
                          }
                        />
                      </>
                      <>
                        <span className="createTopicLabel">
                          Topic Description
                        </span>
                        <textarea
                          placeholder="Description"
                          className="createTopicTitleInput createTopicTextArea"
                          maxLength={800}
                          value={newTopic.description}
                          onChange={(e) =>
                            setNewTopic({
                              ...newTopic,
                              description: e.target.value,
                            })
                          }
                        />
                      </>
                      <PermissionsGate scopes={[SCOPES.canAddTopicRestriction]}>
                        <>
                          {currentForumAccessToken.length > 0 && (
                            <div className="gateCheckbox">
                              <input
                                type="checkbox"
                                checked={keepGates}
                                onChange={(e) => {
                                  setKeepGates(e.target.checked);
                                }}
                              />
                              <div className="createTopicLabel">
                                Keep Existing Forum Gates on Topic
                              </div>
                            </div>
                          )}
                          {isSuccess(forumData.restriction) && <div></div>}
                          <span className="createTopicLabel">
                            Limit post access
                          </span>
                          <input
                            type="text"
                            placeholder="Token mint ID"
                            className="newAccessToken"
                            name="accessToken"
                            value={newTopic.accessToken}
                            onChange={(e) =>
                              setNewTopic({
                                ...newTopic,
                                accessToken: e.target.value,
                              })
                            }
                          />
                        </>
                      </PermissionsGate>
                    </div>
                  }
                  loading={creatingNewTopic}
                  okButton={
                    <button
                      className="okButton"
                      disabled={newTopic.title.length === 0}
                      onClick={() => createTopic()}>
                      Create
                    </button>
                  }
                  cancelButton={
                    <button
                      className="cancelButton"
                      onClick={() => setShowNewTopicModal(false)}>
                      Cancel
                    </button>
                  }
                />
              );
            }
          } else {
            return null;
          }
        })()}
        {_.isNil(modalInfo) && showAddModerators && (
          <PopUpModal
            id="add-moderators"
            visible
            title={"Manage moderators"}
            body={
              <div className="addModeratorsBody">
                <label className="addModeratorsLabel">Add new</label>
                <input
                  placeholder="Add moderator's wallet ID here"
                  className="addModeratorsInput"
                  maxLength={800}
                  value={newModerator}
                  onChange={(e) => setNewModerator(e.target.value)}
                />
                <label className="addModeratorsLabel">Current moderators</label>
                <ul>
                  {currentMods.map((m) => {
                    return (
                      <li key={m} className="currentModerators">
                        <div className="iconContainer">
                          <Jdenticon value={m} alt="moderatorId" />
                        </div>
                        {m}
                      </li>
                    );
                  })}
                </ul>
              </div>
            }
            loading={addingNewModerator}
            okButton={
              <button className="okButton" onClick={() => addModerators()}>
                Save
              </button>
            }
            onClose={() => setShowAddModerators(false)}
          />
        )}
        {_.isNil(modalInfo) && showAddOwners && (
          <PopUpModal
            id="add-owners"
            visible
            title={"Manage owners"}
            body={
              <div className="addModeratorsBody">
                <label className="addModeratorsLabel">Add new</label>
                <input
                  placeholder="Add owners's wallet ID here"
                  className="addModeratorsInput"
                  maxLength={800}
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                />
                <label className="addModeratorsLabel">Current owners</label>
                <ul>
                  {currentOwners.map((m) => {
                    return (
                      <li key={m} className="currentModerators">
                        <div className="iconContainer">
                          <Jdenticon value={m} alt="moderatorId" />
                        </div>
                        {m}
                      </li>
                    );
                  })}
                </ul>
              </div>
            }
            loading={addingNewOwner}
            okButton={
              <button className="okButton" onClick={() => addOwner()}>
                Save
              </button>
            }
            onClose={() => setShowAddOwners(false)}
          />
        )}
        {forumHeader}
        <PermissionsGate scopes={[SCOPES.canEditForum]}>
          <div className="moderatorToolsContainer">
            <div>Owner tools: </div>
            <div className="lock">
              <Lock />
            </div>
            <PermissionsGate scopes={[SCOPES.canAddOwner]}>
              <button
                className="moderatorTool owners"
                disabled={!permission.readAndWrite}
                onClick={() => setShowAddOwners(true)}>
                Manage owners
              </button>
            </PermissionsGate>
            <PermissionsGate scopes={[SCOPES.canEditMods]}>
              <button
                className="moderatorTool"
                disabled={!permission.readAndWrite}
                onClick={() => setShowAddModerators(true)}>
                Manage moderators
              </button>
            </PermissionsGate>
            <PermissionsGate scopes={[SCOPES.canAddForumRestriction]}>
              <button
                className="moderatorTool"
                disabled={!permission.readAndWrite}
                onClick={() => setShowManageAccessToken(true)}>
                Manage forum access
              </button>
            </PermissionsGate>
            <EditForum forumData={forumData} update={update} />
          </div>
        </PermissionsGate>
        {!_.isNil(forumData.collectionId) && (
          <TopicList forumData={forumData} />
        )}
      </div>
    </div>
  );
}
