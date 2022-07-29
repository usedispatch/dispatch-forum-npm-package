import { web3 } from "@project-serum/anchor";
import { useForum, useRole } from "../../contexts/DispatchProvider";
import { PERMISSIONS } from "../../utils/permissions";

interface PermissionsGateProps {
  children: React.ReactNode;
  scopes: string[];
  posterKey?: web3.PublicKey;
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
  const { role } = useRole();
  const permissions = PERMISSIONS[role];
  const Forum = useForum();
  const wallet = Forum.wallet;
  const permissionGranted =
    hasPermission({ permissions, scopes }) ||
    wallet.publicKey?.toBase58() === posterKey?.toBase58() ||
    process.env.REACT_APP_DEBUG_MODE;
  if (!permissionGranted) return RenderError ? <RenderError /> : null;

  return <>{children}</>;
}
