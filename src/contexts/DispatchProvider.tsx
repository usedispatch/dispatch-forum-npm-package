import {
  Cluster,
  Connection,
} from '@solana/web3.js';
import { DispatchForum, MainForum, PostboxVersion } from './../utils/postbox/postboxWrapper';
import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

import { DebugWarning } from './../components/common/DebugWarning';
import ReactGA from 'react-ga4';
import { SearchContextManager } from '@giphy/react-components';
import { UserRoleType } from './../utils/permissions';
import { WalletInterface } from '@usedispatch/client';
import { isNil } from 'lodash';
import { useForumStore } from '../store/modules/forum';

export interface DispatchAppProps {
  wallet: WalletInterface;
  connection: Connection;
  cluster: Cluster;
  children: ReactNode | ReactNode[];
  themeMode?: 'light' | 'dark';
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
  roles: UserRoleType[];
  setRoles: Function;
}

export interface ThemeObject {
  mode: 'light' | 'dark';
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const ForumContext = createContext<DispatchForum>({} as DispatchForum);
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const PathContext = createContext<PathObject>({} as PathObject);
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const UserRoleContext = createContext<UserObject>({} as UserObject);
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const ThemeContext = createContext<ThemeObject>({} as ThemeObject);

export const DispatchProvider: FC<DispatchAppProps> = ({
  wallet,
  connection,
  cluster,
  children,
  buildForumPath,
  buildTopicPath,
  themeMode,
}) => {
  ReactGA.initialize('G-QD3BDH1D5P');

  const forum = useMemo(
    () => new MainForum(wallet, connection, cluster, PostboxVersion.v1),
    [wallet, connection, cluster],
  );
  const APIForum = useMemo(
    () => new APIForum(wallet, connection, cluster, PostboxVersion.v2),
    [wallet, connection, cluster],
  );
  const paths = {
    buildForumPath,
    buildTopicPath,
  };
  useForumStore.setState((state) => {
    state.APIForumObject = APIForum;
  });
  // const state = useForumStore((forum) => forum.state.APIForumObject);
  // useForumStore.setState((state) => { APIForumObject: APIForum });
  const [roles, setRoles] = useState([UserRoleType.Viewer]);

  const userRole = { roles, setRoles };

  const theme = { mode: isNil(themeMode) ? 'light' : themeMode };

  return (
    <ForumContext.Provider value={forum}>
      <PathContext.Provider value={paths}>
        <UserRoleContext.Provider value={userRole}>
          <SearchContextManager apiKey="S869Msi1OL3o4bPrwFjLG2bRABGLbvix">
            <DebugWarning />
            <ThemeContext.Provider value={theme}>
              {children}
            </ThemeContext.Provider>
          </SearchContextManager>
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

export function useTheme(): ThemeObject {
  return useContext(ThemeContext);
}
