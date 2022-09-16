import * as _ from "lodash";
import { useState, ReactNode, useEffect } from "react";
import { ForumPost } from "@usedispatch/client";

import { Success, Vote } from "../../../assets";
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
import { ForumData } from "../../../utils/hooks";
import { isSuccess } from "../../../utils/loading";

interface VotesProps {
  post: ForumPost;
  forumData: ForumData;
  update: () => Promise<void>;
  onUpVotePost: () => Promise<string>;
  onDownVotePost: () => Promise<string>;
  updateVotes: (upVoted: boolean) => void;
}

export function Votes(props: VotesProps) {
  const Forum = useForum();
  const permission = Forum.permission;
  const { post, onDownVotePost, onUpVotePost, updateVotes, update, forumData } = props;

  const [isNotificationHidden, setIsNotificationHidden] = useState(true);
  const [notificationContent, setNotificationContent] = useState<{
    content: string | ReactNode;
    type: MessageType;
  }>();

  const [loading, setLoading] = useState(false);
  const [alreadyUpVoted, setAlreadyUpVoted] = useState(false);
  const [alreadyDownVoted, setAlreadyDownVoted] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const setVotes = async () => {
    if (isSuccess(forumData.votes)) {
    const vote = forumData.votes.find((v) => v.postId === post.postId);
      // redundancy needed for wallet change case and
      // either upvote or downvote previously set to true
    if (vote?.upVote === true) {
        setAlreadyUpVoted(true);
        setAlreadyDownVoted(false);
      } else if (vote?.upVote === false) {
        setAlreadyDownVoted(true);
        setAlreadyUpVoted(false);
      }
    }
  }

  useEffect(() => { 
    setVotes()
  }, [forumData.votes]);

  const upVotePost = async () => {
    setLoading(true);

    try {
      const tx = await onUpVotePost();
      updateVotes(true);
      setAlreadyUpVoted(true);
      setAlreadyDownVoted(false);
      setLoading(false);
      setIsNotificationHidden(false);
      setNotificationContent({
        content: (
          <>
            You voted!
            <TransactionLink transaction={tx} />
          </>
        ),
        type: MessageType.success,
      });
      setTimeout(
        () => setIsNotificationHidden(true),
        NOTIFICATION_BANNER_TIMEOUT
      );
    } catch (error: any) {
      console.log(error);
      if (error.code === 4001) {
        setModalInfo({
          title: "The post could not be up voted",
          type: MessageType.error,
          body: `The user cancelled the request`,
        });
      } else {
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: "The post could not be up voted",
          collapsible: { header: "Error", content: error.message },
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
      setAlreadyDownVoted(true);
      setAlreadyUpVoted(false);
      setIsNotificationHidden(false);
      setNotificationContent({
        content: (
          <>
            You voted!
            <TransactionLink transaction={tx} />
          </>
        ),
        type: MessageType.success,
      });
      setTimeout(
        () => setIsNotificationHidden(true),
        NOTIFICATION_BANNER_TIMEOUT
      );
      setLoading(false);
    } catch (error: any) {
      console.log(error);
      if (error.code === 4001) {
        setModalInfo({
          title: "The post could not be down voted",
          type: MessageType.error,
          body: "The user cancelled the request",
        });
      } else {
        setModalInfo({
          title: "Something went wrong!",
          type: MessageType.error,
          body: "The post could not be down voted.",
          collapsible: { header: "Error", content: error.message },
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
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setIsNotificationHidden(true)}
        />
        <div className="votePostContent">
          <button
            className={`votePostButton upVote` + (alreadyUpVoted ? "d" : "")}
            disabled={alreadyUpVoted || !permission.readAndWrite}
            onClick={upVotePost}>
            <Vote isUpVote />
          </button>
          {loading ? (
            <div className="spinnerContainer">
              <Spinner />
            </div>
          ) : (
            <div className="currentVotes">{post.upVotes - post.downVotes}</div>
          )}
          <button
            className={`votePostButton downVote`+ (alreadyDownVoted ? "d" : "")}
            disabled={alreadyDownVoted || !permission.readAndWrite}
            onClick={downVotePost}>
            <Vote />
          </button>
        </div>
      </div>
    </>
  );
}
