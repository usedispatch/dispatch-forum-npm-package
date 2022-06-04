import * as _ from "lodash";
import { useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { ForumInfo } from "@usedispatch/client";
import * as web3 from "@solana/web3.js";

import { plus } from "../../assets";
import { MessageType, PopUpModal, Spinner } from "../../components/common";
import { ForumContent } from "../../components/forums";

import { useConnection } from "../../contexts/ConnectionProvider";
import { MainForum } from "../../utils/postbox/postboxWrapper";
import { userRole, UserRoleType } from "../../utils/postbox/userRole";

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
  const { collectionId } = props;
  const wallet = useWallet();
  const { connected, publicKey } = wallet;
  const { connection } = useConnection();
  const Forum = new MainForum(wallet, connection);

  const [forum, setForum] = useState<ForumInfo>();
  const [showNewForumModal, setShowNewForumModal] = useState(false);
  const [role, setRole] = useState<UserRoleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
  } | null>(null);
  // TODO(Ana): future task [moderators, setModerators] = useState<string[]>([]);

  const collectionPublicKey = useMemo(
    () => new web3.PublicKey(collectionId),
    [collectionId]
  );

  const croppedCollectiondID = `${collectionId.slice(
    0,
    4
  )}...${collectionId.slice(-4)}`;

  const getForumForCollection = async () => {
    try {
      const [res, desc] = await Promise.all([
        Forum.getForumForCollection(collectionPublicKey),
        Forum.getDescription(collectionPublicKey),
      ]);

      setLoading(false);
      if (!_.isNil(res) && !_.isNil(desc)) {
        setForum({
          collectionId: collectionPublicKey,
          owners: [publicKey!],
          moderators: [publicKey!],
          title: desc.title,
          description: desc.desc,
        });
      }
    } catch (error) {
      setLoading(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The forum for the collection ${croppedCollectiondID} could not be fetched.`,
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
      });
    }
  }, [Forum, collectionPublicKey]);

  const onCreateForumClick = () => {
    if (connected) {
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
          body: `The forum '${title}' for the collection ${croppedCollectiondID} could not be created.`,
        });
      }

      const forum = {
        owners: [publicKey],
        // TODO(Ana): future task moderators.map((m) => new web3.PublicKey(m)),
        moderators: [publicKey],
        title: title,
        description: description,
        collectionId: new web3.PublicKey(collectionId),
      } as ForumInfo;

      const createdForum = await Forum.createForum(forum);

      if (createdForum) {
        getForumForCollection();
        setModalInfo({
          title: `The forum  was created!`,
          body: `The forum '${title}' for the collection ${croppedCollectiondID} was created`,
          type: MessageType.success,
        });
      }
    } catch (error) {
      setLoading(false);
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The forum '${title}' for the collection ${croppedCollectiondID} could not be created.`,
      });
    }
  };

  useEffect(() => {
    if (connected && !_.isNil(publicKey)) {
      setLoading(true);
      getForumForCollection();
    } else {
      localStorage.removeItem("role");
      setLoading(false);
      setForum(undefined);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (connected && !_.isNil(publicKey) && !_.isNil(forum)) {
      const localStorageRole = localStorage.getItem("role");
      if (_.isNil(localStorageRole)) {
        getUserRole();
      } else {
        setRole(localStorageRole as UserRoleType);
      }
    } else {
      localStorage.removeItem("role");
    }
  }, [connected, publicKey, forum]);

  const createForumButton = (
    <div className="flex pt-3 text-2xs text-gray-500">
      <button
        type="button"
        className="btn btn-primary bg-gray-800 text-white   hover:bg-gray-700 hover:text-white "
        onClick={() => {
          if (connected) {
            setShowNewForumModal(true);
          } else {
            setModalInfo({
              title: "Something went wrong",
              type: MessageType.warning,
              body: "Connect to your wallet in order to create a forum",
            });
          }
        }}
      >
        <div className="mr-2">
          <Image src={plus} height={14} width={14} alt="plus" />
        </div>
        Create a new Forum
      </button>
    </div>
  );

  const emptyView = (
    <div className="flex flex-col items-center">
      <div className="text-[40px] pb-14 text-center font-raleway">
        The Forum does not exist yet
      </div>
      <div className="text-center text-base font-light w-[650px] pb-24 font-raleway">
        Create one to post, share, and more
      </div>
      {createForumButton}
    </div>
  );

  const disconnectedView = (
    <div className="flex flex-col items-center">
      <div className="text-center text-2xl font-medium w-[650px] pt-24 font-raleway">
        Connect to your wallet in order to see or create a forum
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      <PopUpModal
        id="create-forum-info"
        visible={!_.isNil(modalInfo)}
        title={modalInfo?.title}
        messageType={modalInfo?.type}
        body={modalInfo?.body}
        okButton={
          <a
            className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white border-2"
            onClick={() => setModalInfo(null)}
          >
            OK
          </a>
        }
      />
      <PopUpModal
        id="create-forum"
        visible={showNewForumModal}
        title={"Create new Forum"}
        body={
          <div className="flex flex-col justify-start w-full">
            <>
              <span className="px-1 text-sm font-medium">Forum Title</span>
              <input
                type="text"
                placeholder="Title"
                className="input input-bordered input-sm w-full mt-1 mb-4 border-gray-300 placeholder-gray-400"
                name="name"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </>
            <>
              <span className="px-1 text-sm font-medium">
                Forum Description
              </span>
              <textarea
                placeholder="Description"
                className="input input-bordered h-36 w-full mt-1 mb-4 border-gray-300 placeholder-gray-400"
                maxLength={800}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </>
            {/* TODO(Ana): future task */}
            {/* <>
              <span className="px-1 text-sm font-medium">Forum Moderators</span>
              <textarea
                placeholder="Moderators id separated by a comma"
                className="input input-bordered h-36 w-full mt-1 border-gray-300 placeholder-gray-400"
                maxLength={800}
                value={moderators}
                onChange={(e) => setModerators(e.target.value.split(","))}
              />
            </> */}
          </div>
        }
        okButton={
          <button
            type="submit"
            className="form-control btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
            onClick={() => {
              setShowNewForumModal(false);
              onCreateForumClick();
            }}
          >
            Create
          </button>
        }
        cancelButton={
          <div
            className="btn btn-secondary border-2 hover:opacity-75 hover:bg-gray-200"
            onClick={() => setShowNewForumModal(false)}
          >
            Cancel
          </div>
        }
      />
      <div className="min-h-full">
        {!_.isNil(forum) && (
            <div className="font-raleway text-4xl pt-16">
              Welcome to the forum {forum.title}
            </div>
        )}
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 pb-6 sm:px-0">
              {loading ? (
                <div className="pt-48">
                  <Spinner />
                </div>
              ) : connected ? (
                !_.isNil(forum) ? (
                  <ForumContent forum={forum} role={role ?? undefined} />
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
    </div>
  );
};
