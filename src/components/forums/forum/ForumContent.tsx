import * as _ from "lodash";
import { useState, ReactNode } from "react";
import Jdenticon from "react-jdenticon";

import { Plus } from "../../../assets";
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
import { PostRestriction } from "@usedispatch/client";

interface ForumContentProps {
  forumObject: DispatchForum;
  forumData: ForumData;
  update: () => Promise<void>;
}

export function ForumContent(props: ForumContentProps) {
  const { forumData, forumObject, update } = props;
  const { role } = useRole();
  const { permission } = forumObject;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  const [showAddModerators, setShowAddModerators] = useState(false);
  const [showAddOwners, setShowAddOwners] = useState(false);
  const [newModerator, setNewModerator] = useState<string>("");
  const [newOwner, setNewOwner] = useState<string>("");
  const [addingNewModerator, setAddingNewModerator] = useState(false);
  const [addingNewOwner, setAddingNewOwner] = useState(false);

  const [showAddAccessToken, setShowAddAccessToken] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");
  const [currentForumAccessToken, setCurrentForumAccessToken] = useState<
    string[]
  >(() => {
    if (isSuccess(forumData.restriction)) {
      return forumData.restriction?.nftOwnership
        ? [forumData.restriction.nftOwnership.collectionId.toBase58()]
        : forumData.restriction.nftListAnyOwnership
        ? forumData.restriction.nftListAnyOwnership.collectionIds.map(
            (pkey) => {
              return pkey.toBase58();
            }
          )
        : forumData.restriction.tokenOwnership
        ? [forumData.restriction.tokenOwnership.mint.toBase58()]
        : [];
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
      const tokenCSV = newForumAccessToken.replace(/\s+/g, "");
      const csvList = tokenCSV.split(",");
      const currentIds = currentForumAccessToken.map((token) => {
        return newPublicKey(token);
      });
      const newIds = csvList.map((token) => {
        return newPublicKey(token);
      });
      const accessCollectionIds = newIds.concat(currentIds);

      const restrictionList = {
        nftListAnyOwnership: {
          collectionIds: accessCollectionIds,
        },
      } as PostRestriction;

      const tx = await forumObject.setForumPostRestriction(
        forumData.collectionId,
        restrictionList
      );

      setShowAddAccessToken(false);
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
    } catch (error: any) {
      setAddingAccessToken(false);
      if (error.code !== 4001) {
        // setCurrentForumAccessToken(
        //   isSuccess(forumData.restriction)
        //     ? [forumData.restriction?.nftOwnership?.collectionId.toBase58()] ?? [""]
        //     : [""]
        // );
        setShowAddAccessToken(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The access token could not be added`,
          collapsible: { header: "Error", content: error.message },
        });
      }
    }
  };

  const createTopic = async () => {
    const p = {
      subj: title,
      body: description,
    };

    setCreatingNewTopic(true);
    try {
      const token = accessToken ? newPublicKey(accessToken) : undefined;
      const tx = await forumObject.createTopic(
        p,
        forumData.collectionId,
        token ? { nftOwnership: { collectionId: token } } : undefined
      );
      if (!_.isNil(tx)) {
        setCreatingNewTopic(false);
        setModalInfo({
          body: <TransactionLink transaction={tx} />,
          type: MessageType.success,
          title: "Topic created!",
        });
        setTitle("");
        setDescription("");
        setAccessToken("");
        setShowNewTopicModal(false);
        forumObject.connection.confirmTransaction(tx).then(() => update());
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
      }}
    >
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
        <PermissionsGate scopes={[SCOPES.canCreateTopic]}>
          {createTopicButton}
        </PermissionsGate>
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
        {showAddAccessToken && _.isNil(modalInfo) && (
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
                {currentForumAccessToken.map((token) => {
                  return <div className="currentAccessToken">{token}</div>;
                })}
              </div>
            }
            loading={addingAccessToken}
            onClose={() => {
              setShowAddAccessToken(false);
              setNewForumAccessToken("");
            }}
            okButton={
              <button className="okButton" onClick={() => addAccessToken()}>
                Save
              </button>
            }
            // cancelButton={
            //   <button
            //     className="cancelButton"
            //     onClick={() => {
            //       setShowAddAccessToken(false);
            //       setNewForumAccessToken("");
            //     }}>
            //     Cancel
            //   </button>
            // }
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
                <PermissionsGate scopes={[SCOPES.canAddTopicRestriction]}>
                  <>
                    <span className="createTopicLabel">Limit post access</span>
                    <input
                      type="text"
                      placeholder="Token mint ID"
                      className="newAccessToken"
                      name="accessToken"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                    />
                  </>
                </PermissionsGate>
              </div>
            }
            loading={creatingNewTopic}
            okButton={
              <button
                className="okButton"
                disabled={title.length === 0}
                onClick={() => createTopic()}
              >
                Create
              </button>
            }
            onClose={() => {
              setShowNewTopicModal(false);
            }}
            // cancelButton={
            //   <button
            //     className="cancelButton"
            //     onClick={() => setShowNewTopicModal(false)}
            //   >
            //     Cancel
            //   </button>
            // }
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
            // cancelButton={
            //   <button
            //     className="cancelButton"
            //     onClick={() => setShowAddModerators(false)}>
            //     Cancel
            //   </button>
            // }
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
            // cancelButton={
            //   <button
            //     className="cancelButton"
            //     onClick={() => setShowAddOwners(false)}
            //   >
            //     Cancel
            //   </button>
            // }
          />
        )}
        {forumHeader}
        {role === UserRoleType.Owner && (
          <div className="moderatorToolsContainer">
            <PermissionsGate
              scopes={[SCOPES.canEditMods, SCOPES.canAddForumRestriction]}
            >
              <div>Moderator tools: </div>
              <PermissionsGate scopes={[SCOPES.canAddOwner]}>
                <button
                  className="moderatorTool"
                  disabled={!permission.readAndWrite}
                  onClick={() => setShowAddOwners(true)}
                >
                  Manage owners
                </button>
              </PermissionsGate>
              <button
                className="moderatorTool"
                disabled={!permission.readAndWrite}
                onClick={() => setShowAddModerators(true)}
              >
                Manage moderators
              </button>
              <button
                className="moderatorTool"
                disabled={!permission.readAndWrite}
                onClick={() => setShowAddAccessToken(true)}
              >
                Manage forum access
              </button>
            </PermissionsGate>
            <EditForum forumData={forumData} update={update} />
          </div>
        )}
        {!_.isNil(forumData.collectionId) && (
          <TopicList forumData={forumData} />
        )}
      </div>
    </div>
  );
}
