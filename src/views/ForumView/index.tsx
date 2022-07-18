import "./../../style.css";
import * as _ from "lodash";
import {
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from "react";
import { ForumInfo } from "@usedispatch/client";
import * as web3 from "@solana/web3.js";

import { Plus } from "../../assets";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Spinner,
  TransactionLink,
} from "../../components/common";
import {
  ConnectionAlert,
  ForumContent,
  PoweredByDispatch,
} from "../../components/forums";

import { userRole, UserRoleType } from "../../utils/postbox/userRole";
import { useForum } from "./../../contexts/DispatchProvider";
import { newPublicKey } from "./../../utils/postbox/validateNewPublicKey";

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
  const Forum = useForum();
  const wallet = Forum.wallet;
  const { publicKey } = Forum.wallet;
  const isNotEmpty = Forum.isNotEmpty;
  const permission = Forum.permission;

  const collectionId = props.collectionId;

  const mount = useRef(false);
  const [forum, setForum] = useState<ForumInfo>();
  const [showNewForumModal, setShowNewForumModal] = useState(false);
  const [creatingNewForum, setCreatingNewForum] = useState(false);
  const [role, setRole] = useState<UserRoleType | null>();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newModerator, setNewModerator] = useState<string>("");
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const [collectionPublicKey, setCollectionPublicKey] = useState<any>();
  const [croppedCollectionID, setCroppedCollectionId] = useState<string>("");

  useEffect(() => {
    mount.current = true;
    try {
      const collectionIdKey = new web3.PublicKey(collectionId);
      setCollectionPublicKey(collectionIdKey);
      setCroppedCollectionId(
        `${collectionId.slice(0, 4)}...${collectionId.slice(-4)}`
      );
    } catch (error) {
      const message = JSON.stringify(error);
      console.log(error);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "Invalid Collection ID Public Key",
        collapsible: { header: "Error", content: message },
      });
    }
    return () => {
      mount.current = false;
    };
  }, []);

  const getForumForCollection = useCallback(async () => {
    try {
      const [res, desc, mods] = await Promise.all([
        Forum.getForumForCollection(collectionPublicKey),
        Forum.getDescription(collectionPublicKey),
        Forum.getModerators(collectionPublicKey),
      ]);

      setLoading(false);
      if (!_.isNil(res) && !_.isNil(desc) && !_.isNil(mods) && mount.current) {
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
      const message = JSON.stringify(error);
      console.log(error);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The forum for the collection ${croppedCollectionID} could not be fetched.`,
        collapsible: { header: "Error", content: message },
      });
    }
  }, [Forum, collectionPublicKey]);

  const getUserRole = useCallback(async () => {
    try {
      const role = await userRole(Forum, collectionPublicKey);
      if (mount.current) {
        setRole(role);
      }
    } catch (error) {
      const message = JSON.stringify(error);
      console.log(error);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "Your user role could not be determined, you will only have permission to create topics and comment",
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
    setCreatingNewForum(true);

    try {
      if (!wallet) {
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
        });
      }

      const moderators =
        newModerator.length > 0
          ? [publicKey, newPublicKey(newModerator)]
          : [publicKey];

      const forum = {
        owners: [publicKey],
        moderators,
        title: title,
        description: description,
        collectionId: collectionPublicKey,
      } as ForumInfo;

      const res = await Forum.createForum(forum);

      if (!_.isNil(res?.forum)) {
        getForumForCollection();
        setShowNewForumModal(false);
        setModalInfo({
          title: `Success!`,
          body: (
            <div className="successBody">
              <div>{`The forum '${title}' for the collection ${croppedCollectionID} was created`}</div>
              <div>
                {res?.txs.map((tx) => (
                  <TransactionLink transaction={tx} />
                ))}
              </div>
            </div>
          ),
          type: MessageType.success,
        });
      }
    } catch (error: any) {
      if (error.code === 4001) {
        setShowNewForumModal(true);
      } else {
        setShowNewForumModal(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
          collapsible: { header: "Error", content: JSON.stringify(error) },
        });
      }
    } finally {
      setCreatingNewForum(false);
    }
  };

  useEffect(() => {
    if (
      isNotEmpty &&
      !_.isNil(publicKey) &&
      !_.isNil(collectionPublicKey) &&
      mount.current
    ) {
      setLoading(true);
      getForumForCollection();
    } else {
      setLoading(false);
      setForum(undefined);
    }
  }, [isNotEmpty, publicKey, collectionId, mount.current]);

  useEffect(() => {
    if (isNotEmpty && !_.isNil(forum)) {
      getUserRole();
    }
  }, [forum, isNotEmpty, publicKey]);

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
    <div className="dsp-">
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
                    disabled={creatingNewForum}
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
                    disabled={creatingNewForum}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </>
                <>
                  <span className="createForumLabel">Moderator</span>
                  <input
                    placeholder="Add moderator's wallet ID here"
                    className="createForumTitle createForumTextArea"
                    maxLength={800}
                    value={newModerator}
                    disabled={creatingNewForum}
                    onChange={(e) => setNewModerator(e.target.value)}
                  />
                </>
              </div>
            }
            loading={creatingNewForum}
            okButton={
              <button
                type="submit"
                className="acceptCreateForumButton"
                onClick={() => onCreateForumClick()}>
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
    </div>
  );
};
