import * as _ from "lodash";
import { useState, ReactNode, useEffect } from "react";
import { ForumPost } from "@usedispatch/client";

import { DownVote, UpVote, Success } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Spinner,
  TransactionLink,
} from "../../common";
import { Notification } from "..";
import { useForum } from "./../../../contexts/DispatchProvider";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";

interface VotesProps {
  post: ForumPost;
  onUpVotePost: () => Promise<string>;
  onDownVotePost: () => Promise<string>;
  updateVotes: (upVoted: boolean) => void;
}

export function Votes(props: VotesProps) {
  const Forum = useForum();
  const { post, onDownVotePost, onUpVotePost, updateVotes } = props;

  const [isNotificationHidden, setIsNotificationHidden] = useState(true);
  const [notificationContent, setNotificationContent] = useState<
    string | ReactNode
  >("");
  const [loading, setLoading] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const permission = Forum.permission;
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const upVotePost = async () => {
    setLoading(true);

    try {
      const tx = await onUpVotePost();
      updateVotes(true);
      setAlreadyVoted(true);
      setLoading(false);
      setIsNotificationHidden(false);
      setNotificationContent(
        <>
          <Success />
          Up voted successfully.
          <TransactionLink transaction={tx} />
        </>
      );
      setTimeout(() => setIsNotificationHidden(true), NOTIFICATION_BANNER_TIMEOUT);
    } catch (error: any) {
      console.log(error);
      if (error.code === 4001) {
        setModalInfo({
          title: "The post could not be up voted",
          type: MessageType.error,
          body: `The user cancelled the request`,
        });
      } else {
        const message = JSON.stringify(error);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The post could not be up voted. Error: ${message}`,
          collapsible: { header: "Error", content: message },
        });
      }
      setLoading(false);
    }
  };

  const downVotePost = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const tx = await onDownVotePost();
      updateVotes(false);
      setAlreadyVoted(true);
      setIsNotificationHidden(false);
      setNotificationContent(
        <>
          <Success />
          Down voted successfully.
          <TransactionLink transaction={tx} />
        </>
      );
      setTimeout(() => setIsNotificationHidden(true), NOTIFICATION_BANNER_TIMEOUT);
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      if (error.code === 4001) {
        setModalInfo({
          title: "The post could not be down voted",
          type: MessageType.error,
          body: `The user cancelled the request`,
        });
      } else {
        const message = JSON.stringify(error);
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: "The post could not be down voted.",
          collapsible: { header: "Error", content: message },
        });
      }

      setLoading(false);
    }
  };

  return (
    <>
      {!_.isNil(modalInfo) && (
        <PopUpModal
          id="vote-info"
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
      <div className="votePostContainer">
        <Notification
          hidden={isNotificationHidden}
          content={notificationContent}
          onClose={() => setIsNotificationHidden(true)}
        />
        <div className="votePostContent">
          <button
            className="votePostButton"
            disabled={alreadyVoted || !permission.readAndWrite}
            onClick={upVotePost}>
            <UpVote />
          </button>
          {loading ? (
            <div className="spinnerContainer">
              <Spinner />
            </div>
          ) : (
            <div className="currentVotes">{post.upVotes - post.downVotes}</div>
          )}
          <button
            className="votePostButton"
            disabled={alreadyVoted || !permission.readAndWrite}
            onClick={downVotePost}>
            <DownVote />
          </button>
        </div>
      </div>
    </>
  );
}
