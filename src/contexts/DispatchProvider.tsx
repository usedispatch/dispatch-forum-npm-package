import { web3 } from "@project-serum/anchor";
import { WalletInterface } from "@usedispatch/client";
import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { DispatchForum, MainForum } from "./../utils/postbox/postboxWrapper";
import { UserRoleType } from "./../utils/permissions";
import { DebugWarning } from "./../components/common/DebugWarning";
export interface DispatchAppProps {
  wallet: WalletInterface;
  connection: web3.Connection;
  cluster: web3.Cluster;
  children: ReactNode | ReactNode[];
  buildForumPath: typeof ForumPathFunction;
  buildTopicPath: typeof TopicPathFunction;
}

// define function types
let ForumPathFunction: (collectionId: string) => string;
let TopicPathFunction: (collectionId: string, topicId: number) => string;

export interface PathObject {
  buildForumPath: typeof ForumPathFunction;
  buildTopicPath: typeof TopicPathFunction;
}

export interface UserObject {
  role: UserRoleType;
  setRole: Function;
}

export const ForumContext = createContext<DispatchForum>({} as DispatchForum);
export const PathContext = createContext<PathObject>({} as PathObject);
export const UserRoleContext = createContext<UserObject>({} as UserObject);

export const DispatchProvider: FC<DispatchAppProps> = ({
  wallet,
  connection,
  cluster,
  children,
  buildForumPath,
  buildTopicPath,
}) => {
  const forum = useMemo(
    () => new MainForum(wallet, connection, cluster),
    [wallet, connection, cluster]
  );
  const paths = {
    buildForumPath: buildForumPath,
    buildTopicPath: buildTopicPath,
  };
  const [role, setRole] = useState(UserRoleType.Viewer);

  const userRole = { role, setRole };
  return (
    <ForumContext.Provider value={forum}>
      <PathContext.Provider value={paths}>
        <UserRoleContext.Provider value={userRole}>
          <DebugWarning />
          {children}
        </UserRoleContext.Provider>
      </PathContext.Provider>
    </ForumContext.Provider>
  );
};

export function useRole(): UserObject {
  return useContext(UserRoleContext);
}

export function useForum(): DispatchForum {
  return useContext(ForumContext);
}

export function usePath(): PathObject {
  return useContext(PathContext);
}
