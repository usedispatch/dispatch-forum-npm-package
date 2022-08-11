import { useCallback, useMemo } from "react";
import { maxBy } from "lodash";
import Jdenticon from "react-jdenticon";
import { ForumPost } from "@usedispatch/client";

import { usePath } from "./../../../contexts/DispatchProvider";
import { Link } from "./../../../components/common";
import {
  selectRepliesFromPosts,
  selectTopics,
  sortByVotes,
} from "../../../utils/posts";
import { ForumData } from "../../../utils/hooks";

interface TopicListProps {
  forumData: ForumData;
}

export function TopicList({ forumData }: TopicListProps) {
  const topics: ForumPost[] = useMemo(() => {
    const topics = selectTopics(forumData.posts);
    return sortByVotes(topics);
  }, [forumData]);

  return (
    <div className="topicListContainer">
      <div>
        <table className="tableContainer">
          <thead>
            <tr className="tableHeader">
              <th className="tableHeaderTitle">
                <div className="tableHeaderText">Topics</div>
              </th>
              <th className="tableHeaderTitle">
                <div className="tableHeaderText posters">Posters</div>
              </th>
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
              <RowContent key={index} topic={topic} forumData={forumData} />
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
  const topicPath = buildTopicPath(
    forumData.collectionId.toBase58(),
    topic.postId
  );

  const replies: ForumPost[] = useMemo(() => {
    return selectRepliesFromPosts(forumData.posts, topic);
  }, [forumData]);

  const activtyDate = useCallback((posts: ForumPost[]) => {
    const dates = posts.map(({ data }) => data.ts);
    const mostRecentDate = maxBy(dates, (date) => date.getTime());
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
      return "-";
    }
  }, []);

  return (
    <tr className="row ">
      <th className="rowSubj">
        <Link className="" href={topicPath}>
          <div className="textBox">{topic.data.subj}</div>
        </Link>
      </th>
      <td className="rowIconReplies">
        <Link className="" href={topicPath}>
          {icons(replies)}
        </Link>
      </td>
      <td className="rowAmountReplies">
        <Link className="" href={topicPath}>
          {replies.length}
        </Link>
      </td>
      <td className="rowDate">
        <Link className="" href={topicPath}>
          {activtyDate(replies)}
        </Link>
      </td>
    </tr>
  );
}
