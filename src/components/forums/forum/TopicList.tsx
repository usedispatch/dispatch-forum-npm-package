import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  useRef,
} from "react";
import { maxBy } from 'lodash';
import Jdenticon from "react-jdenticon";
import * as web3 from "@solana/web3.js";
import { ForumPost } from "@usedispatch/client";

import { Spinner } from "../../common";

import { useForum, usePath } from "./../../../contexts/DispatchProvider";
import { Link } from "./../../../components/common";
import { selectRepliesFromPosts, selectTopics } from '../../../utils/posts';
import { ForumData } from '../../../utils/hooks';

interface TopicListProps {
  forumData: ForumData
}

export function TopicList({ forumData }: TopicListProps) {
  const topics: ForumPost[] = useMemo(() => {
    const topics = selectTopics(forumData.posts);
    // TODO(andrew) refactor this sort into a helper function
    return topics.sort((left, right) => {
      const leftVotes = left.upVotes - left.downVotes;
      const rightVotes = right.upVotes - right.downVotes;
      return rightVotes - leftVotes;
    });
  }, [forumData]);

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
            {topics.map((topic, index) => (
                <RowContent
                  key={index}
                  topic={topic}
                  forumData={forumData}
                />
              ))}
          </tbody>
        </table>
        {topics.length === 0 && (
          <div className="emptyTopicList">No topics yet</div>
        )}
      </div>
    </div>
  );
}

interface RowContentProps {
  topic: ForumPost;
  forumData: ForumData;
}

function RowContent(props: RowContentProps) {
  const { topic, forumData } = props;
  const { buildTopicPath } = usePath();
  const topicPath = buildTopicPath(forumData.collectionId.toBase58(), topic.postId);

  const replies: ForumPost[] = useMemo(() => {
    return selectRepliesFromPosts(forumData.posts, topic);
  }, [forumData]);

  const activtyDate = useCallback((posts: ForumPost[]) => {
    const dates = posts.map(({ data }) => data.ts);
    const mostRecentDate = maxBy(dates, (date) =>
      date.getTime()
    );
    if (mostRecentDate) {
      const format = (
        mostRecentDate.getFullYear() !== new Date().getFullYear()
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

      return mostRecentDate.toLocaleDateString(undefined, { ...format });
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

  return (
    <tr className="row ">
      <th>
        <Link className="rowSubj" href={topicPath}>
          {topic.data.subj}
        </Link>
      </th>
      <td>
        <Link className="rowIconReplies" href={topicPath}>
          {icons(replies)}
        </Link>
      </td>
      <td>
        <Link className="rowAmountReplies" href={topicPath}>
          {replies.length}
        </Link>
      </td>
      <td>
        <Link className="rowDate" href={topicPath}>
          {activtyDate(replies)}
        </Link>
      </td>
    </tr>
  );
}
