import "./../../style.css";
import * as _ from "lodash";
import { useState, useEffect, ReactNode, useCallback, useContext } from "react";
import { ForumInfo } from "@usedispatch/client";
import * as web3 from "@solana/web3.js";

import { Plus } from "../../assets";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Spinner,
} from "../../components/common";
import {
  ConnectionAlert,
  ForumContent,
  PoweredByDispatch,
} from "../../components/forums";

import { userRole, UserRoleType } from "../../utils/postbox/userRole";
import permission from "../../utils/postbox/permission.json";
import { ForumContext } from "./../../contexts/DispatchProvider";

interface ForumViewProps {
  collectionId: string;
}
/**
 * 1- fetch collectionId from url
 * 2- make sure user has login
 * 2.5 getUserCategory(wallet, collectionId): user category
 * 3- if the getUserCategory() == owner of collection {
 *     const Forum = new MainForum(category = "owner");
 *      Forum.category === "owner"
 *      add form with input and button (pass public key)
 * }
 * else if getUserCategory() == moderator of collection {
 *     const Forum = new MainForum(category = "moderator");
 *      Forum.category === "moderator"
 *      add form with input and button (pass public key)
 * }
 * else if getUserCategory() == poster {
 *     const Forum = new MainForum(category = "poster");
 *      Forum.category === "poster"
 * }
 * 4- have a global variable indicating user category
 * 5- a-initialize forum
 * b-delete forum
 * c-add moderator
 * d-delete moderator
 * e-create post
 * f-delete own post
 * g-delete any post
 * 6- forum as owner can 5.a to 5.g
 *    forum as Moderator can 5.c to 5.g
 *    forum as poster can 5.e and 5.f
 */

export const ForumView = (props: ForumViewProps) => {
  const Forum = useContext(ForumContext);
  const wallet = Forum.wallet;
  const { publicKey } = Forum.wallet;
  const isNotEmpty = Forum.isNotEmpty;

  const collectionId = props.collectionId;

  const [forum, setForum] = useState<ForumInfo>();
  const [showNewForumModal, setShowNewForumModal] = useState(false);
  const [role, setRole] = useState<UserRoleType | null>();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newModerators, setNewModerators] = useState<string[]>([]);
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const [collectionPublicKey, setCollectionPublicKey] = useState<any>();
  const [croppedCollectionID, setCroppedCollectionId] = useState<string>("");

  useEffect(() => {
    try {
      const collectionIdKey = new web3.PublicKey(collectionId);
      setCollectionPublicKey(collectionIdKey);
      setCroppedCollectionId(collectionId);
    } catch (error) {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "Invalid Collection ID Public Key",
        collapsible: { header: "Error", content: error },
      });
    }
  }, []);

  const getForumForCollection = async () => {
    try {
      const [res, desc, mods] = await Promise.all([
        Forum.getForumForCollection(collectionPublicKey),
        Forum.getDescription(collectionPublicKey),
        Forum.getModerators(collectionPublicKey),
      ]);

      setLoading(false);
      if (!_.isNil(res) && !_.isNil(desc) && !_.isNil(mods)) {
        setForum({
          collectionId: collectionPublicKey,
          owners: publicKey ? [publicKey] : [],
          moderators: mods,
          title: desc.title,
          description: desc.desc,
        });
      }
    } catch (error) {
      setLoading(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The forum for the collection ${croppedCollectionID} could not be fetched.`,
        collapsible: { header: "Error", content: error },
      });
    }
  };

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

  const getModerators = useCallback(async () => {
    try {
      const mods = await Forum.getModerators(collectionPublicKey);
      if (!_.isNil(mods)) {
        setForum({ ...forum, moderators: mods ?? [] } as ForumInfo);
      }
    } catch (error) {
      const message = JSON.stringify(error);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "The moderators could not be determined",
        collapsible: { header: "Error", content: message },
      });
    }
  }, [Forum, collectionPublicKey]);

  const onCreateForumClick = () => {
    if (isNotEmpty) {
      createForum();
    } else {
      setModalInfo({
        title: "Something went wrong",
        type: MessageType.warning,
        body: "Connect to your wallet in order to create a forum",
      });
    }
  };

  const createForum = async () => {
    setLoading(true);

    try {
      if (!wallet) {
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
        });
      }

      const forum = {
        owners: [publicKey],
        moderators: [publicKey].concat(
          newModerators.map((m) => new web3.PublicKey(m))
        ),
        title: title,
        description: description,
        collectionId: collectionPublicKey,
      } as ForumInfo;

      const createdForum = await Forum.createForum(forum);

      if (createdForum) {
        getForumForCollection();
        setModalInfo({
          title: `The forum  was created!`,
          body: `The forum '${title}' for the collection ${croppedCollectionID} was created`,
          type: MessageType.success,
        });
      }
    } catch (error) {
      setLoading(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
        collapsible: { header: "Error", content: error },
      });
    }
  };

  useEffect(() => {
    if (isNotEmpty && !_.isNil(publicKey)) {
      setLoading(true);
      getForumForCollection();
    } else {
      setLoading(false);
      setForum(undefined);
    }
  }, [isNotEmpty, publicKey]);

  useEffect(() => {
    if (isNotEmpty && !_.isNil(forum)) {
      const localStorageRole = localStorage.getItem("role");
      if (_.isNil(localStorageRole)) {
        getUserRole();
      } else {
        setRole(localStorageRole as UserRoleType);
      }
    } else {
      localStorage.removeItem("role");
    }
  }, [forum, isNotEmpty]);

  const createForumButton = (
    <div className="createForumButtonContainer">
      <button
        type="button"
        className="okInfoButton"
        disabled={!permission.readAndWrite}
        onClick={() => {
          if (isNotEmpty) {
            setShowNewForumModal(true);
          } else {
            setModalInfo({
              title: "Something went wrong",
              type: MessageType.warning,
              body: "Connect to your wallet in order to create a forum",
            });
          }
        }}>
        <div className="createForumIconContainer">
          <Plus />
        </div>
        Create a new Forum
      </button>
    </div>
  );

  const emptyView = (
    <div className="emptyForumView">
      <div className="emptyTitle">The Forum does not exist yet</div>
      <div className="emptySubTitle">
        {permission.readAndWrite
          ? "Create one to post, share, and more"
          : "Contact the owner of this collection or a moderator to start the forum."}
      </div>
      {createForumButton}
    </div>
  );

  const disconnectedView = (
    <div className="disconnectedView">
      Connect to your wallet in order to see or create a forum
    </div>
  );

  return (
    <div className="forumView">
      {!_.isNil(modalInfo) && (
        <PopUpModal
          id="create-forum-info"
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
      {showNewForumModal && (
        <PopUpModal
          id="create-forum"
          visible
          title={"Create new Forum"}
          body={
            <div className="createForumBody">
              <>
                <span className="createForumLabel">Forum Title</span>
                <input
                  type="text"
                  placeholder="Title"
                  className="createForumTitle"
                  name="name"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </>
              <>
                <span className="createForumLabel">Forum Description</span>
                <textarea
                  placeholder="Description"
                  className="createForumTitle createForumDescription"
                  maxLength={800}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </>
              <>
                <span className="createForumLabel">Moderators</span>
                <input
                  placeholder="Add moderators' wallet ID here, separated by commas"
                  className="createForumTitle createForumTextArea"
                  maxLength={800}
                  value={newModerators}
                  onChange={(e) => setNewModerators(e.target.value.split(","))}
                />
              </>
            </div>
          }
          okButton={
            <button
              type="submit"
              className="acceptCreateForumButton"
              onClick={() => {
                setShowNewForumModal(false);
                onCreateForumClick();
              }}>
              Create
            </button>
          }
          cancelButton={
            <div
              className="cancelCreateForumButton"
              onClick={() => setShowNewForumModal(false)}>
              Cancel
            </div>
          }
        />
      )}
      {!permission.readAndWrite && <ConnectionAlert />}
      <div className="forumViewContainer">
        <div className="forumViewContent">
          {!_.isNil(forum) && (
            <div
              className={`forumViewTitle ${
                !permission.readAndWrite ? "alert" : ""
              }`}>
              {forum.title}
            </div>
          )}
          <main>
            <div className="forumViewContentBox">
              <div>
                {loading ? (
                  <div className="forumLoading">
                    <Spinner />
                  </div>
                ) : isNotEmpty ? (
                  !_.isNil(forum) ? (
                    <ForumContent
                      forum={forum}
                      role={role ?? UserRoleType.Poster}
                      onAddModerators={getModerators}
                    />
                  ) : (
                    emptyView
                  )
                ) : (
                  disconnectedView
                )}
              </div>
            </div>
          </main>
        </div>
        <PoweredByDispatch />
      </div>
    </div>
  );
};
