import "./../../style.css";
import * as _ from "lodash";
import { useState, useEffect, useMemo, ReactNode, useCallback, useRef } from "react";
import { ForumInfo, ForumPost } from "@usedispatch/client";
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
import { selectTopics } from '../../utils/posts';

import { useForum, useRole } from "./../../contexts/DispatchProvider";
import { newPublicKey } from "./../../utils/postbox/validateNewPublicKey";
import { getUserRole } from "./../../utils/postbox/userRole";
import { Loading } from '../../types/loading';
import { useForumData } from '../../utils/hooks';

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
  const forumObject = useForum();
  const Role = useRole();
  const { isNotEmpty, wallet, permission } = forumObject;
  const { publicKey } = wallet;

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
  } | null>(null);
  const [croppedCollectionID, setCroppedCollectionId] = useState<string>("");

  const collectionId = props.collectionId;
  const collectionPublicKey = useMemo(() => {
    try {
      const pubkey = new web3.PublicKey(collectionId);

      // TODO(andrew) make croppedCollectionID a useMemo() call as well?
      // see https://www.notion.so/usedispatch/Only-Show-Forums-with-valid-Public-Keys-eaf833a2d69a4bc69f760509b4bfee6d
      setCroppedCollectionId(
        `${collectionId.slice(0, 4)}...${collectionId.slice(-4)}`
      );

      return pubkey;
    } catch (error) {
      const message = JSON.stringify(error);
      console.log(error);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "Invalid Collection ID Public Key",
        collapsible: { header: "Error", content: message },
      });
      return null;
    }
  }, [collectionId]);

  const mount = useRef(false);
  const { forumData, update } = useForumData(collectionPublicKey, forumObject);

  // Title and description for editing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showNewForumModal, setShowNewForumModal] = useState(false);
  const [creatingNewForum, setCreatingNewForum] = useState(false);
  const [newModerator, setNewModerator] = useState("");
  const [accessToken, setAccessToken] = useState<string>();

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

      const tokenAccess = accessToken ? newPublicKey(accessToken) : undefined;

      const res = await forumObject.createForum(forum);

      if (!_.isNil(res?.forum)) {
        if (!_.isNil(tokenAccess)) {
          await forumObject.setForumPostRestriction(collectionPublicKey!, {
            nftOwnership: {
              collectionId: tokenAccess
            }
          });
        }

        setShowNewForumModal(false);
        setModalInfo({
          title: `Success!`,
          body: (
            <div className="successBody">
              <div>{`The forum '${title}' for the collection ${croppedCollectionID} was created`}</div>
              <div>
                {res?.txs.map((tx) => (
                  <TransactionLink transaction={tx} key={tx} />
                ))}
              </div>
            </div>
          ),
          type: MessageType.success,
        });
        update();
      }
    } catch (e: any) {
      if (e.error.code === 4001) {
        setShowNewForumModal(true);
      } else {
        setShowNewForumModal(false);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
          collapsible: { header: "Error", content: e.message },
        });
      }
    } finally {
      setCreatingNewForum(false);
    }
  };

  useEffect(() => {
    update();
    // Update every time wallet or cluster is changed
  }, [forumObject.wallet, forumObject.cluster]);


  useEffect(() => {
    if( isNotEmpty && forumData.state === 'success' && forumObject.wallet.publicKey) {
      getUserRole(forumObject, collectionPublicKey!, Role);
    }
  }, [forumData, isNotEmpty, publicKey]);

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
                    className="createForumInput"
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
                    className="createForumInput createForumDescription"
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
                    className="createForumInput"
                    value={newModerator}
                    disabled={creatingNewForum}
                    onChange={(e) => setNewModerator(e.target.value)}
                  />
                </>
                <>
                  <span className="createForumLabel">Limit forum access</span>
                  <input
                    placeholder="Collection ID"
                    className="createForumInput lastInputField"
                    value={accessToken}
                    disabled={creatingNewForum}
                    onChange={(e) => setAccessToken(e.target.value)}
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
            {forumData.state === 'success' && (
              <div
                className={`forumViewTitle ${
                  !permission.readAndWrite ? "alert" : ""
                }`}>
                {forumData.value.info.title}
              </div>
            )}
            <main>
              <div className="forumViewContentBox">
                <div>
                  {(() => {
                    if (forumData.state === 'initial' ||
                        forumData.state === 'pending') {
                      return (
                        <div className="forumLoading">
                          <Spinner />
                        </div>
                      );
                    } else if (forumData.state === 'success') {
                      return (
                        <ForumContent
                          forumObject={forumObject}
                          forumData={forumData.value}
                          update={update}
                        />
                      );
                    } else if (forumData.state === 'notFound' ) {
                      return emptyView;
                    } else if (forumData.state === 'failed') {
                      return disconnectedView
                    }
                  })()}
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
