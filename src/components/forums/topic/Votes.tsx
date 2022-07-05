import * as _ from "lodash";
import { useState, ReactNode } from "react";
import { ForumPost } from "@usedispatch/client";

import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Spinner,
} from "../../common";
import { DownVote, UpVote } from "../../../assets";

import permission from "../../../utils/postbox/permission.json";

interface VotesProps {
  post: ForumPost;
  onUpVotePost: () => void;
  onDownVotePost: () => void;
  updateVotes: (upVoted: boolean) => void;
}

export function Votes(props: VotesProps) {
  const { post, onDownVotePost, onUpVotePost, updateVotes } = props;
  const [loading, setLoading] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const upVotePost = async () => {
    setLoading(true);

    try {
      await onUpVotePost();
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: "The post was up voted",
      });
      updateVotes(true);
      setAlreadyVoted(true);
      setLoading(false);
    } catch (error) {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The post could not be up voted. Error: ${error}`,
        collapsible: { header: "Error", content: error },
      });
      setLoading(false);
    }
  };

  const downVotePost = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      await onDownVotePost();
      setModalInfo({
        title: "Success!",
        type: MessageType.success,
        body: "The post was down voted",
      });
      updateVotes(false);
      setAlreadyVoted(true);
      setLoading(false);
    } catch (error) {
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "The post could not be down voted.",
        collapsible: { header: "Error", content: error },
      });
      setLoading(false);
    }
  };

  const currentVotes = post.upVotes - post.downVotes;

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
            <div className="currentVotes">
              {currentVotes < 0 ? "-" : currentVotes}
            </div>
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
