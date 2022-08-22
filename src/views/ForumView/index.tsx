import "./../../style.css";
import * as _ from "lodash";
import {
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { ForumInfo, ForumPost, PostRestriction } from "@usedispatch/client";
import * as web3 from "@solana/web3.js";
import { Helmet } from "react-helmet";
import ReactGA from "react-ga4";

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
  UploadForumImage,
  PoweredByDispatch,
} from "../../components/forums";
import { selectTopics } from "../../utils/posts";

import { useForum, useRole } from "./../../contexts/DispatchProvider";
import { newPublicKey } from "./../../utils/postbox/validateNewPublicKey";
import { getUserRole } from "./../../utils/postbox/userRole";
import { Loading } from "../../types/loading";
import {
  isSuccess,
  isInitial,
  isPending,
  isNotFound,
} from "../../utils/loading";
import { useForumData, useModal } from "../../utils/hooks";
import { pubkeysToRestriction } from "../../utils/restrictionListHelper";

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
  ReactGA.send("pageview");
  const forumObject = useForum();
  const Role = useRole();
  const { wallet, permission } = forumObject;
  const { publicKey } = wallet;

  const [croppedCollectionID, setCroppedCollectionId] = useState<string>("");

  const { modal, showModal } = useModal();

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
      showModal({
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showNewForumModal, setShowNewForumModal] = useState(false);
  const [creatingNewForum, setCreatingNewForum] = useState(false);
  const [newModerator, setNewModerator] = useState("");
  const [newOwners, setNewOwners] = useState("");
  const [bannerImage, setBannerImage] = useState<URL | null>(null);
  const [accessToken, setAccessToken] = useState<string>();
  const [bodySize, setBodySize] = useState<number>(0);
  const onCreateForumClick = () => {
    createForum();
  };

  const createForum = async () => {
    setCreatingNewForum(true);

    try {
      if (!wallet) {
        showModal({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
        });
      }

      // TODO(andrew) do A LOT more validation here of possible badly-behaved strings

      const moderators =
        newModerator.length > 0
          ? [publicKey, newPublicKey(newModerator)]
          : [publicKey];

      const additionalOwnerKeys = newOwners
        // Split at commas TODO also at commas with whitespace,
        // e.g. '<key1> , <key2>'
        .split(',')
        // Remove the empty string wherever it is found
        .filter(str => str.length > 0)
        // Transform into pubkey
        .map(o => newPublicKey(o));

      const owners = [publicKey].concat(additionalOwnerKeys);

      const forum = {
        owners,
        moderators,
        title: title,
        description: description,
        collectionId: collectionPublicKey,
        postRestriction: accessToken
          ? pubkeysToRestriction(accessToken)
          : undefined,
      } as ForumInfo;

      const res = await forumObject.createForum(forum);

      if (bannerImage && collectionPublicKey) {
        const imgs = await forumObject.setImageUrls(
          collectionPublicKey,
          bannerImage.href
        );
      }

      if (!_.isNil(res?.forum)) {
        setShowNewForumModal(false);
        showModal({
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

        if (res?.txs) {
          await Promise.all(
            res.txs.map((tx) => forumObject.connection.confirmTransaction(tx))
          ).then(() => update());
        }
      }
    } catch (e: any) {
      if (e.error?.code === 4001) {
        setShowNewForumModal(true);
      } else {
        setShowNewForumModal(false);
        showModal({
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
    // Update every time the cluster is changed
  }, [forumObject.cluster]);

  useEffect(() => {
    if (isSuccess(forumData) && permission.readAndWrite) {
      getUserRole(forumObject, collectionPublicKey!, Role);
    } else if (isNotFound(forumData) && permission.readAndWrite) {
      setShowNewForumModal(true);
    }
  }, [forumData, publicKey]);

  const createForumButton = (
    <div className="createForumButtonContainer">
      <button
        type="button"
        className="okInfoButton"
        disabled={!permission.readAndWrite}
        onClick={() => {
          setShowNewForumModal(true);
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
      <div className="emptyTitle">Connect your wallet to create a forum!</div>
      <div className="emptySubTitle">Create one to post, share, and more</div>
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
      <Helmet>
        <meta charSet="utf-8" />
        {isSuccess(forumData) ? (
          <title>{forumData.description.title}</title>
        ) : (
          <title>Create Forum for {collectionId}</title>
        )}
      </Helmet>
      <div className="forumView">
        {modal}
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
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setBodySize(new Buffer(e.target.value).byteLength);
                    }}
                  />
                  <div className="textSize">{bodySize}/800</div>
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
                  <span className="createForumLabel">Owners</span>
                  <input
                    placeholder="Add a comma separated list of owners IDs"
                    className="createForumInput"
                    value={newOwners}
                    disabled={creatingNewForum}
                    onChange={(e) => setNewOwners(e.target.value)}
                  />
                </>
                <>
                  <span className="createForumLabel">Limit forum access</span>
                  <input
                    placeholder="Add a comma separated list of collection IDs"
                    className="createForumInput"
                    value={accessToken}
                    disabled={creatingNewForum || bodySize > 800}
                    onChange={(e) => setAccessToken(e.target.value)}
                  />
                </>
                <>
                  <span className="createForumLabel">Upload banner image</span>
                  <UploadForumImage setImageURL={(url) => setBannerImage(url)} />
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
            {(() => {
              if (isSuccess(forumData)) {
                return (
                  <ForumContent
                    forumObject={forumObject}
                    forumData={forumData}
                    update={update}
                  />
                );
              } else if (isInitial(forumData) || isPending(forumData)) {
                return (
                  <div className="forumLoading">
                    <Spinner />
                  </div>
                );
              } else if (isNotFound(forumData)) {
                return emptyView;
              } else {
                // TODO(andrew) better, more detailed error
                // view here
                return disconnectedView;
              }
            })()}
          </div>
          <PoweredByDispatch />
        </div>
      </div>
    </div>
  );
};
