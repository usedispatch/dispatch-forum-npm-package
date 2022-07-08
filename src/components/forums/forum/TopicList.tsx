import { useState, useEffect, useCallback, useMemo, useContext, useRef } from "react";
import Jdenticon from "react-jdenticon";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Spinner } from "../../common";

import {
  ForumContext,
  useForum,
  usePath,
} from "./../../../contexts/DispatchProvider";

interface TopicListProps {
  loading: boolean;
  topics: ForumPost[];
  collectionId: web3.PublicKey;
}

export function TopicList(props: TopicListProps) {
  const { topics, collectionId, loading } = props;

  return (
    <div className="topicListContainer">
      <div>
        <table className="tableContainer">
          <thead>
            <tr className="tableHeader">
              <th className="tableHeaderTitle">
                <div className="tableHeaderText">Topic</div>
              </th>
              <th className="tableHeaderTitle"></th>
              <th className="tableHeaderTitle">
                <div className="tableHeaderTextCenter">Replies</div>
              </th>
              <th className="tableHeaderTitle">
                <div className="tableHeaderTextCenter">Activity</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              topics.map((topic, index) => (
                <RowContent
                  key={index}
                  topic={topic}
                  collectionId={collectionId}
                />
              ))}
          </tbody>
        </table>
        {loading ? (
          <div className="topicListSpinner">
            <Spinner />
          </div>
        ) : (
          topics.length === 0 && (
            <div className="emptyTopicList">No topics yet</div>
          )
        )}
      </div>
    </div>
  );
}

interface RowContentProps {
  topic: ForumPost;
  collectionId: web3.PublicKey;
}

function RowContent(props: RowContentProps) {
  const { collectionId, topic } = props;
  const Forum = useForum();
  const { buildTopicPath } = usePath();
  const topicPath = buildTopicPath(collectionId.toBase58(), topic.postId);
  const mount = useRef(false);
  const [messages, setMessages] = useState<ForumPost[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const getMessages = async () => {
    try {
      const data = await Forum.getTopicMessages(topic.postId, collectionId);
      if (mount.current) {
        setMessages(data ?? []);
      }
      setLoading(false);
    } catch (error) {
      const message = JSON.stringify(error);
      console.log(error)
      setMessages(undefined);
      setLoading(false);
    }
  };

  useEffect(() => {
    mount.current = true;
    getMessages();
    return () => {
      mount.current = false;
    }
  }, [topic.postId, collectionId]);

  const activtyDate = useCallback((posts: ForumPost[]) => {
    if (posts.length > 0) {
      const date = new Date(posts.slice(-1)[0].data.ts);
      const format = (
        date.getFullYear() !== new Date().getFullYear()
          ? {
              year: "numeric",
              month: "short",
              day: "numeric",
            }
          : {
              year: undefined,
              month: "short",
              day: "numeric",
            }
      ) as Intl.DateTimeFormatOptions;

      return date.toLocaleDateString(undefined, { ...format });
    } else {
      return "-";
    }
  }, []);

  const icons = useCallback((posts: ForumPost[]) => {
    if (posts.length > 0) {
      const ids = posts.slice(0, 8).map((p) => p.poster.toBase58());

      return (
        <div className="rowContentIcons">
          {ids.map((id, index) => (
            <div key={index} className="icon">
              <Jdenticon value={id} alt="posterID" />
            </div>
          ))}
          {posts.length > 8 ? "..." : null}
        </div>
      );
    } else {
      return null;
    }
  }, []);

  const spinner = useMemo(
    () => (
      <div className="rowSpinner">
        <Spinner />
      </div>
    ),
    []
  );

  return (
    <tr className="row ">
      <>
        <th>
          <div className="rowSubj">
            <a href={topicPath}>{topic.data.subj}</a>
          </div>
        </th>
        <td>
          <div className="rowIconReplies">
            <a href={topicPath}>
              {loading || !messages ? spinner : icons(messages)}
            </a>
          </div>
        </td>
        <td>
          <div className="rowAmountReplies">
            <a href={topicPath}>
              {loading || !messages ? spinner : messages.length}
            </a>
          </div>
        </td>
        <td>
          <div className="rowDate">
            <a href={topicPath}>
              {loading || !messages ? spinner : activtyDate(messages)}
            </a>
          </div>
        </td>
      </>
    </tr>
  );
}
