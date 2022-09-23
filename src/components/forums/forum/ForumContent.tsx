import isNil from "lodash/isNil";
import { PublicKey } from "@solana/web3.js";
import Markdown from "markdown-to-jsx";
import { useState, ReactNode, useEffect } from "react";
import ReactGA from "react-ga4";
import { PostRestriction } from "@usedispatch/client";

import { Lock, Plus, Trash } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PermissionsGate,
  PopUpModal,
  TransactionLink,
  Spinner,
} from "../../common";
import {
  TopicList,
  EditForum,
  ManageOwners,
  ManageModerators,
  UploadForumBanner,
  ConnectionAlert,
} from "..";
import { useRole } from "../../../contexts/DispatchProvider";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { SCOPES, UserRoleType } from "../../../utils/permissions";
import { Result } from "../../../types/error";
import { isError, errorSummary } from "../../../utils/error";
import { isSuccess } from "../../../utils/loading";
import {
  ForumData,
  useForumIdentity,
  ForumIdentity,
} from "../../../utils/hooks";
import {
  restrictionListToString,
  pubkeysToRestriction,
} from "../../../utils/restrictionListHelper";
import { StarsAlert } from "../StarsAlert";

interface ForumContentProps {
  forumObject: DispatchForum;
  forumData: ForumData;
  update: () => Promise<void>;
}

export function ForumContent(props: ForumContentProps) {
  const { forumData, forumObject, update } = props;
  const { roles } = useRole();
  const { permission } = forumObject;

  const forumIdentity = useForumIdentity(forumData.collectionId);

  const [newTopic, setNewTopic] = useState<{
    title: string;
    description: string;
    accessToken: string;
  }>({ title: "", description: "", accessToken: "" });

  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [creatingNewTopic, setCreatingNewTopic] = useState(false);
  const [newTopicInFlight, setNewTopicInFlight] = useState(false);
  const [keepGates, setKeepGates] = useState(true);

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

  const addAccessToken = async () => {
    setAddingAccessToken(true);
    const restriction = pubkeysToRestriction(
      newForumAccessToken,
      isSuccess(forumData.restriction) ? forumData.restriction : undefined
    );

    if (isError(restriction)) {
      const error = restriction;
      setAddingAccessToken(false);
      setShowManageAccessToken(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The access token could not be added`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
      return;
    }

    const currentIds = restrictionListToString(restriction);

    const tx = await forumObject.setForumPostRestriction(
      forumData.collectionId,
      restriction
    );
    if (isSuccess(tx)) {
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
    } else {
      const error = tx;
      setAddingAccessToken(false);
      setShowManageAccessToken(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The access token could not be added`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
    }
  };

  const deleteAccessToken = async () => {
    setRemoveAccessToken({ ...removeAccessToken, removing: true });
    const filteredTokens = currentForumAccessToken.filter(
      (t) => t != removeAccessToken.token
    );

    let tx: Result<string>;
    if (filteredTokens.length > 0) {
      const restrictionList = pubkeysToRestriction(filteredTokens.join(","));
      if (isError(restrictionList)) {
        const error = restrictionList;
        setRemoveAccessToken({ show: false, removing: false });
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The access token could not be removed`,
          collapsible: { header: "Error", content: errorSummary(error) },
        });
        return;
      }
      tx = await forumObject.setForumPostRestriction(
        forumData.collectionId,
        restrictionList
      );
    } else {
      tx = await forumObject.deleteForumPostRestriction(forumData.collectionId);
    }

    setCurrentForumAccessToken(filteredTokens);
    setRemoveAccessToken({ show: false, removing: false });

    if (isSuccess(tx)) {
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
    } else {
      const error = tx;
      setRemoveAccessToken({ show: false, removing: false });
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The access token could not be removed`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
    }
  };

  const createTopic = async () => {
    const p = {
      subj: newTopic.title,
      body: newTopic.description,
    };

    setCreatingNewTopic(true);
    let restrictionResult: Result<PostRestriction> | undefined;
    // First case checks if existing gates are kept and new ones being added
    // Second case removes existing gates and adds new ones
    // Third case removes existing gates
    // Final case keeps existing gates
    if (keepGates && newTopic.accessToken !== "") {
      restrictionResult = pubkeysToRestriction(
        newTopic.accessToken,
        isSuccess(forumData.restriction) ? forumData.restriction : undefined
      );
    } else if (!keepGates && newTopic.accessToken !== "") {
      restrictionResult = pubkeysToRestriction(newTopic.accessToken);
    } else if (!keepGates) {
      restrictionResult = { null: {} };
    } else {
      // No restriction
      restrictionResult = undefined;
    }

    if (isError(restrictionResult)) {
      const error = restrictionResult;
      setCreatingNewTopic(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The topic could not be created`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
      setShowNewTopicModal(false);
      return;
    }

    // the possibility of error is no longer present, so rename
    // this variable restriction
    const restriction = restrictionResult;

    const tx = await forumObject.createTopic(
      p,
      forumData.collectionId,
      restriction
    );
    if (isSuccess(tx)) {
      setCreatingNewTopic(false);
      setNewTopicInFlight(true);
      setModalInfo({
        body: <TransactionLink transaction={tx} />,
        type: MessageType.success,
        title: "Topic created!",
      });
      setNewTopic({ title: "", description: "", accessToken: "" });
      setShowNewTopicModal(false);

      // re-load forum in background
      await forumObject.connection.confirmTransaction(tx).then(() => {
        update();
        setNewTopicInFlight(false);
      });
    } else {
      const error = tx;
      setCreatingNewTopic(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The topic could not be created`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
      setShowNewTopicModal(false);
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
      <div className={"titleBox"}>
        {currentForumAccessToken.length > 0 && (
          <div className="gatedForum">
            <Lock />
          </div>
        )}
        <Markdown>{forumData.description.title}</Markdown>
        {/* TODO(andrew) what to render here if title isn't loaded */}
      </div>
      <div className="descriptionBox">
        <div className="description">
          <Markdown>{forumData.description.desc}</Markdown>
        </div>
        {createTopicButton}
      </div>
    </div>
  );

  return (
    <div className="dsp- ">
      <div className="forumContent">
        <>
          {ReactGA.send("pageview")}
          {!isNil(modalInfo) && (
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
          {showManageAccessToken && isNil(modalInfo) && (
            <PopUpModal
              id="add-access-token"
              visible
              title="Limit forum access"
              body={
                <div className="addModeratorsBody">
                  <label className="addModeratorsLabel">
                    Add new NFT Collection ID
                  </label>
                  You can enter one NFT Collection ID here such that only
                  holders of NFT's in the collection can participate in this
                  forum.
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
                          <div className="displayName">{token}</div>
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
          {removeAccessToken.show && isNil(modalInfo) && (
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
                <button
                  className="okButton"
                  onClick={() => deleteAccessToken()}>
                  Remove
                </button>
              }
            />
          )}
          {(() => {
            if (showNewTopicModal && isNil(modalInfo)) {
              if (roles.includes(UserRoleType.Viewer)) {
                return (
                  <PopUpModal
                    id="create-topic"
                    title="You are not authorized"
                    body={
                      isSuccess(forumData.restriction) &&
                      forumData.restriction.tokenOwnership?.mint.equals(
                        forumData.moderatorMint
                      )
                        ? "Oops! Only moderators can create new topics at this time."
                        : "Oops! You need a token to participate. Please contact the forum’s moderators."
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
                          <span className="createTopicLabel">Topic title</span>
                          <input
                            type="text"
                            placeholder="Title"
                            className="createTopicTitleInput"
                            name="name"
                            required
                            value={newTopic.title}
                            onChange={(e) =>
                              setNewTopic({
                                ...newTopic,
                                title: e.target.value,
                              })
                            }
                          />
                        </>
                        <>
                          <span className="createTopicLabel">
                            Topic description
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
                        <PermissionsGate
                          scopes={[SCOPES.canAddTopicRestriction]}>
                          <>
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
                            {currentForumAccessToken.length > 0 && (
                              <div className="gateCheckbox">
                                <div className="createTopicLabel">
                                  Keep existing forum gates on topic
                                </div>
                                <input
                                  type="checkbox"
                                  checked={keepGates}
                                  onChange={(e) => {
                                    setKeepGates(e.target.checked);
                                  }}
                                />
                              </div>
                            )}
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
          <div
            className="forumContentBox"
            style={{
              backgroundImage: forumData.images?.background
                ? `url(${forumData.images?.background})`
                : undefined,
            }}>
            {!permission.readAndWrite && <ConnectionAlert />}
            {forumData.collectionId.toBase58() ===
              "DSwfRF1jhhu6HpSuzaig1G19kzP73PfLZBPLofkw6fLD" && <StarsAlert />}
            {forumHeader}
          </div>
          <PermissionsGate scopes={[SCOPES.canEditForum]}>
            <div className="moderatorToolsContainer">
              <div>Owner tools: </div>
              <div className="tools">
                <div className="lock">
                  <Lock />
                </div>
                <ManageOwners forumData={forumData} />
                <ManageModerators forumData={forumData} />
                {
                  // The manage users UI should be hidden for DAA
                  forumIdentity !== ForumIdentity.DegenerateApeAcademy && (
                    <PermissionsGate scopes={[SCOPES.canAddForumRestriction]}>
                      <button
                        className="moderatorTool"
                        disabled={!permission.readAndWrite}
                        onClick={() => setShowManageAccessToken(true)}>
                        Manage forum access
                      </button>
                    </PermissionsGate>
                  )
                }
                <EditForum forumData={forumData} update={update} />
                <UploadForumBanner
                  onSetImageURL={() => update()}
                  collectionId={forumData.collectionId}
                />
              </div>
            </div>
          </PermissionsGate>
          {(() => {
            if (newTopicInFlight) {
              return <Spinner />;
            } else if (!isNil(forumData.collectionId)) {
              return (
                <div className="topicListWrapper">
                  <TopicList forumData={forumData} />
                </div>
              );
            }
          })()}
        </>
      </div>
    </div>
  );
}
