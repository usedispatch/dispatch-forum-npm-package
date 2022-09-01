import * as _ from "lodash";
import { ForumData } from "../../../utils/hooks";

interface RoleLabelProps {
  forumData: ForumData;
  topicOwnerId: string;
  posterId: string;
  // TODO implement moderator check later
  // moderators: string[];
}

export function RoleLabel(props: RoleLabelProps) {
  const { topicOwnerId, posterId } = props;

  const label =
    topicOwnerId === posterId ? "op" : undefined;

  return <div className={`roleLabel ${label}`}>{label}</div>;
}
