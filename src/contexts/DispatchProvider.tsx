import {
  Cluster,
  Connection,
} from '@solana/web3.js';
import { DispatchForum, MainForum } from './../utils/postbox/postboxWrapper';
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
  /**
   * anyone who wants to init a forum passes in dispatchUser object, 
   * dispatchConnection object, and forumId
   * 
   * npm-package maintains forum object and how forum interacts with connection and user
   * 
   * when frontpage integrates npm-package, it...
   * a. creates user object
   * b. creates connection object
   * c. gives forumId to package
   * 
   * 
   * 
   * ** code to create user object from wallet lives in a new library called dispatchUser
   * ** anyone can create their own user through dispatchUser
   * 
   * user is used by 'frontpage' to be created from wallet, as it is used across forums
   * forum only maintains context of forumId and it's own info (posts, topics, etc)
   * user class is defined in client library (as well as connection)
   */
  const forum = useMemo(
    () => new MainForum(wallet, connection, cluster),
    [wallet, connection, cluster],
  );
  const paths = {
    buildForumPath,
    buildTopicPath,
  };
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
