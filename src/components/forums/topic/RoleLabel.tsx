import * as _ from "lodash";

interface RoleLabelProps {
  topicOwnerId: string;
  posterId: string;
  moderators: string[];
}

export function RoleLabel(props: RoleLabelProps) {
  const { topicOwnerId, posterId, moderators } = props;

  const isModerator = moderators.some((m) => m === posterId);

  const label =
    topicOwnerId === posterId ? "op" : isModerator ? "mod" : undefined;

  return <div className={`roleLabel ${label}`}>{label}</div>;
}
