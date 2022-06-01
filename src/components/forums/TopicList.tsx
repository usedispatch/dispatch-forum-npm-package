import { useState, useEffect, useCallback, useMemo } from "react";
import Jdenticon from "react-jdenticon";
import Link from "next/link";
import * as web3 from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { ForumPost } from "@usedispatch/client";

import { Spinner } from "components/common";

import { useConnection } from "contexts/ConnectionProvider";
import { MainForum } from "utils/postbox/postboxWrapper";

interface TopicListProps {
  loading: boolean;
  topics: ForumPost[];
  collectionId: web3.PublicKey;
}

export function TopicList(props: TopicListProps) {
  const { topics, collectionId, loading } = props;

  return (
    <div className="h-auto mx-6 my-4 font-raleway">
      <div>
        <table className="table w-full">
          <thead>
            <tr className="border-b border-black">
              <th className="pb-2">
                <div className="normal-case font-normal text-xl">Topic</div>
              </th>
              <th className="pb-2"></th>
              <th className="pb-2">
                <div className="normal-case font-normal text-xl text-center">
                  Replies
                </div>
              </th>
              <th className="pb-2">
                <div className="normal-case font-normal text-xl text-center">
                  Activity
                </div>
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
          <div className="w-full min-w-full pt-16 text-center">
            <Spinner />
          </div>
        ) : (
          topics.length === 0 && (
            <div className="w-full min-w-full pt-16 text-xl font-semibold text-center">
              No topics yet
            </div>
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
  const wallet = useWallet();
  const { connection } = useConnection();
  const Forum = new MainForum(wallet, connection);

  const [messages, setMessages] = useState<ForumPost[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const getMessages = async () => {
    try {
      const data = await Forum.getTopicMessages(topic.postId, collectionId);
      setMessages(data ?? []);
      setLoading(false);
    } catch (error) {
      setMessages(undefined);
      setLoading(false);
    }
  };

  useEffect(() => {
    getMessages();
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
        <div className="flex items-center">
          {ids.map((id, index) => (
            <div key={index} className="h-7 w-7 mr-1">
              <Jdenticon className="h-7 w-7" value={id} alt="posterID" />
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
      <div className="flex h-7 w-7">
        <Spinner />
      </div>
    ),
    []
  );

  return (
    <Link
      href={{
        pathname: `/forum/${collectionId.toBase58()}/topic/${topic.postId}`,
      }}
      key={`topic_${topic.postId}`}
      passHref
    >
      <tr className="hover hover:bg-blue-100 cursor-pointer">
        <>
          <th>
            <div className="max-w-xl w-[576px] overflow-ellipsis whitespace-nowrap overflow-hidden">
              {topic.data.subj}
            </div>
          </th>
          <td>
            <div className="max-w-xs w-80">
              {loading || !messages ? spinner : icons(messages)}
            </div>
          </td>
          <td>
            <div className="text-center">
              {loading || !messages ? spinner : messages.length}
            </div>
          </td>
          <td>
            <div className="text-center">
              {loading || !messages ? spinner : activtyDate(messages)}
            </div>
          </td>
        </>
      </tr>
    </Link>
  );
}
