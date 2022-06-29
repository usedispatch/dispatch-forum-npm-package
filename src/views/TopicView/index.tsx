import "./../../style.css";
import * as _ from "lodash";
import {
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useContext,
} from "react";
import * as web3 from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { ForumPost } from "@usedispatch/client";

import { PopUpModal, MessageType, Spinner } from "../../components/common";
import { PoweredByDispatch, TopicContent } from "../../components/forums";

import { userRole, UserRoleType } from "../../utils/postbox/userRole";
import { ForumContext, usePath } from "./../../contexts/DispatchProvider";

interface Props {
  topicId: number;
  collectionId: string;
  // forum: ForumInfo;
}

export const TopicView = (props: Props) => {
  const wallet = useWallet();
  const { connecting } = wallet;
  const Forum = useContext(ForumContext);
  const connected = Forum.isNotEmpty;
  const collectionId = props.collectionId;
  // const [topicId, setTopicId] = useState<number>(0);
  const topicId = props.topicId;
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<ForumPost>();
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
  } | null>(null);
  const [role, setRole] = useState<UserRoleType | null>(null);
  const {buildForumPath} = usePath();
  const forumPath = buildForumPath(collectionId);

  const [collectionPublicKey, setCollectionPublicKey] = useState<any>();
  const [croppedCollectionID, setCroppedCollectionId] = useState<string>("");


  useEffect(() => {
    try {
      const collectionIdKey = new web3.PublicKey(collectionId);
      setCollectionPublicKey(collectionIdKey);
      setCroppedCollectionId(collectionId);
    } catch {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "Invalid Public Key",
      });
    }
  }, [])


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

  const getTopicData = async () => {
    setLoading(true);
    try {
            
      const res = await Forum.getTopicData(topicId, collectionPublicKey);
      setTopic(res);
      setLoading(false);
    } catch (error) {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "The topic could not be loaded",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && !_.isNil(topicId)) {
      getTopicData();
    } else {
      if (connecting) {
        setLoading(true);
      } else {
        localStorage.removeItem("role");
        setLoading(false);
        setTopic(undefined);
      }
    }
  }, [connected, connecting, topicId]);

  useEffect(() => {
    if (connected && !_.isNil(collectionPublicKey) && !_.isNil(topic)) {
      const localStorageRole = localStorage.getItem("role");
      if (_.isNil(localStorageRole)) {
        getUserRole();
      } else {
        setRole(localStorageRole as UserRoleType);
      }
    } else {
      localStorage.removeItem("role");
    }
  }, [connected, collectionPublicKey, topic]);

  const disconnectedView = (
    <div className="disconnectedTopicView">
      {connected
        ? `The topic with id ${topicId} does not exist`
        : "Connect to your wallet in order to see the topic"}
    </div>
  );

  return (
    <div className="topicViewContainer">
      {!_.isNil(modalInfo) && (
        <PopUpModal
          id="topic-info"
          visible
          title={modalInfo?.title}
          messageType={modalInfo?.type}
          body={modalInfo?.body}
          okButton={
            <a className="okInfoButton" onClick={() => setModalInfo(null)}>
              OK
            </a>
          }
        />
      )}
      <div className="topicViewContent">
        <main>
          <div>
            {loading ? (
              <div className="topicViewLoading">
                <Spinner />
              </div>
            ) : topic ? (
              <>
                <a href={forumPath}>
                  <button 
                    className="backButton"
                  >
                    Back
                  </button>
                </a>
                <TopicContent
                  topic={topic}
                  forum={Forum}
                  
                  collectionId={collectionPublicKey}
                  userRole={role!}
                />
              </>
            ) : (
              disconnectedView
            )}
          </div>
        </main>
      </div>
      <PoweredByDispatch />
    </div>
  );
};
