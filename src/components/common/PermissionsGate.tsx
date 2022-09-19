import { PublicKey } from '@solana/web3.js';
import { useForum, useRole } from "../../contexts/DispatchProvider";
import { PERMISSIONS } from "../../utils/permissions";

interface PermissionsGateProps {
  children: React.ReactNode;
  scopes: string[];
  posterKey?: PublicKey;
  RenderError?: React.FC;
}

const hasPermission = ({ permissions, scopes }) => {
  const scopesMap = {};
  scopes.forEach((scope) => {
    scopesMap[scope] = true;
  });
  return permissions.some((permission) => scopesMap[permission]);
};

export function PermissionsGate(props: PermissionsGateProps) {
  const { children, scopes, posterKey, RenderError } = props;

  if (process.env.REACT_APP_DEBUG_MODE === "true") {
    return <>{children}</>;
  }

  const { roles } = useRole();
  let permissions = [""];
  roles.forEach((role) => {
    permissions.push(...PERMISSIONS[role]);
   });
  const Forum = useForum();
  const wallet = Forum.wallet;

  const permissionGranted =
    hasPermission({ permissions, scopes }) ||
    wallet.publicKey?.toBase58() === posterKey?.toBase58();
  if (!permissionGranted) {
    return RenderError ? <RenderError /> : null;
  }

  return <>{children}</>;
}
