import * as _ from "lodash";

interface RoleLabelProps {
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
