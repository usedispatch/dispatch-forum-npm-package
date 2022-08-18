import * as _ from "lodash";

import { useForum, useRole } from "../../../contexts/DispatchProvider";

interface RoleLabelProps {
  topicOwnerId: string;
  posterId: string;
  moderators: string[];
}

export function RoleLabel(props: RoleLabelProps) {
  const { topicOwnerId, posterId, moderators } = props;
  const { wallet } = useForum();

  // const currentUserId = wallet.publicKey?.toBase58();
  const isModerator = moderators.some((m) => m === posterId);

  const label =
    topicOwnerId === posterId ? "op" : isModerator ? "mod" : undefined;

  return <div className={`roleLabel ${label}`}>{label}</div>;
}
