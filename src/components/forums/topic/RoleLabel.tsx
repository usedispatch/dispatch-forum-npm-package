import { isNil } from "lodash";
import { PublicKey } from '@solana/web3.js';

interface RoleLabelProps {
  topicOwnerId: PublicKey;
  posterId: PublicKey;
  moderators: PublicKey[] | null;
}

export function RoleLabel(props: RoleLabelProps) {
  const { topicOwnerId, posterId, moderators } = props;

  const isModerator = !isNil(moderators) && moderators.some((m) => m.equals(posterId));

  const label =
    topicOwnerId.equals(posterId) ? "op" : isModerator ? "mod" : undefined;

  return <div className={`roleLabel ${label}`}>{label}</div>;
}
