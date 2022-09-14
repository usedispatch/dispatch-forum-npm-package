import { isNil } from "lodash";
import { PublicKey } from "@solana/web3.js";

interface RoleLabelProps {
  topicOwnerId: PublicKey;
  posterId: PublicKey;
  moderators: PublicKey[] | null;
}

export function RoleLabel(props: RoleLabelProps) {
  const { topicOwnerId, posterId, moderators } = props;

  const isModerator =
    !isNil(moderators) && moderators.some((m) => m.equals(posterId));

  const isOp = topicOwnerId.equals(posterId);

  return (
    <div className="roleLabelContainer">
      {isOp && <div className={"roleLabel op"}>op</div>}
      {isModerator && <div className={"roleLabel mod"}>mod</div>}
    </div>
  );
}
