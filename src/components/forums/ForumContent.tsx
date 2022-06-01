import { useState, useEffect, ReactNode } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { ForumInfo, ForumPost } from "@usedispatch/client";

import { plus } from "assets";
import { MessageType, PopUpModal } from "components/common";
import { TopicList } from "components/forums";

import { useConnection } from "contexts/ConnectionProvider";
import { MainForum } from "utils/postbox/postboxWrapper";
import { UserRoleType } from "utils/postbox/userRole";

interface ForumContentProps {
  forum: ForumInfo;
  role?: UserRoleType;
}

export function ForumContent(props: ForumContentProps) {
  const { forum, role } = props;
  const wallet = useWallet();
  const { connected } = wallet;
  const { connection } = useConnection();
  const Forum = new MainForum(wallet, connection);

  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // TODO(Ana): frture task -> const [moderators, setModerators] = useState<string>("");
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
  } | null>(null);

  const [topics, setTopics] = useState<ForumPost[]>([]);

  // TODO(Ana): future task
  // const addModerators = async () => {
  //   try {
  //     const moderatorsIds = moderators
  //       .split(",")
  //       .map((m) => new web3.PublicKey(m));

  //     await Promise.all(
  //       moderatorsIds.map(async (t) => {
  //         return await Forum.addModerator(t, forum.collectionId);
  //       })
  //     );
  //     setModerators("");
  //     setModalInfo({
  //       title: "Success!",
  //       type: MessageType.success,
  //       body: `The moderators were added`,
  //     });
  //   } catch (error) {
  //     setModalInfo({
  //       title: "Something went wrong!",
  //       type: MessageType.error,
  //       body: `The moderators could not be added`,
  //     });
  //   }
  // };

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
      if (tx) {
        getTopicsForForum();
        setModalInfo({
          body: "The new topic was created",
          type: MessageType.success,
          title: "Success!",
        });
      } else {
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The topic could not be created`,
        });
      }
    } catch (error) {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The topic could not be created`,
      });
    }
  };

  const createTopicButton = (
    <button
      className="btn btn-primary bg-gray-800 text-white hover:bg-gray-700 w-44"
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
      }}
    >
      <div className="mr-2">
        <Image src={plus} height={14} width={14} alt="plus" />
      </div>
      Create Topic
    </button>
  );

  const forumHeader = (
    <div className="h-auto mx-6 mt-4 mb-10">
      <div className="flex items-start justify-between">
        <div className="font-raleway min-h-[120px]">
          <div className="mr-10">{forum.description}</div>
        </div>
        {createTopicButton}
      </div>
    </div>
  );

  useEffect(() => {
    getTopicsForForum();
  }, [forum]);

  return (
    <div className="h-auto">
      <PopUpModal
        id="create-topic-info"
        visible={modalInfo !== null && !showNewTopicModal}
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
        id="create-topic"
        visible={showNewTopicModal && modalInfo === null}
        title={"Create new Topic"}
        body={
          <div className="flex flex-col justify-start w-full">
            <>
              <span className="px-1 text-sm font-medium">Topic Title</span>
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
                Topic Description
              </span>
              <textarea
                placeholder="Description"
                className="input input-bordered h-36 w-full mt-1 border-gray-300 placeholder-gray-400"
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
            className="form-control btn btn-primary bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
            onClick={() => {
              setShowNewTopicModal(false);
              setLoadingTopics(true);
              createTopic();
            }}
          >
            Create
          </button>
        }
        cancelButton={
          <div
            className="btn btn-secondary border-2 hover:opacity-75 hover:bg-gray-200"
            onClick={() => setShowNewTopicModal(false)}
          >
            Cancel
          </div>
        }
      />
      {forumHeader}
      {/* TODO(Ana): future task */}
      {/* <div className="flex items-center justify-end mb-3 mr-6 min-w-[300px]">
        <input
          placeholder="Moderators id separated by a comma"
          className="input input-bordered input-sm w-72 mr-1 border-gray-300 placeholder-gray-400"
          maxLength={800}
          value={moderators}
          onChange={(e) => setModerators(e.target.value)}
        ></input>
        <button
          className="h-8 font-normal text-sm lowercase rounded-md p-3 flex items-center bg-gray-800 text-white hover:bg-gray-700 hover:text-white"
          onClick={() => addModerators()}
        >
          add moderators
        </button>
      </div> */}
      <TopicList
        loading={loadingTopics}
        topics={topics}
        collectionId={forum.collectionId}
      />
    </div>
  );
}
