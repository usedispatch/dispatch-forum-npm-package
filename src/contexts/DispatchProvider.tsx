import { web3 } from '@project-serum/anchor';
import { ForumPost, WalletInterface } from '@usedispatch/client';
import { isUndefined } from 'lodash';
import { FC, ReactNode, createContext, useContext, useMemo, useState } from 'react';
import { DispatchForum, MainForum } from './../utils/postbox/postboxWrapper';
export interface DispatchAppProps {
    wallet: WalletInterface;
    connection: web3.Connection;
    children: ReactNode | ReactNode[];
    buildForumPath: typeof ForumPathFunction;
    buildTopicPath: typeof TopicPathFunction;
}

// define function types
let ForumPathFunction: (collectionId: string) => string;
let TopicPathFunction: (collectionId: string, topicId: number) => string;


export enum UserRoleType {
    Owner = "owner",
    Moderator = "mod",
    Poster = "poster",
    Viewer = "viewer"
  }
export interface PathObject {
    buildForumPath: typeof ForumPathFunction;
    buildTopicPath: typeof TopicPathFunction;
}

export interface UserObject {
    role: UserRoleType;
    getUserRole: Function;
}

export const ForumContext = createContext<DispatchForum>({} as DispatchForum);
export const PathContext = createContext<PathObject>({} as PathObject);
export const UserRoleContext = createContext<UserObject>({} as UserObject);

export const DispatchProvider: FC<DispatchAppProps> = ({ 
    wallet, 
    connection, 
    children,
    buildForumPath,
    buildTopicPath
}) => {
    const forum = useMemo(() => new MainForum(wallet, connection), [wallet, connection])
    const paths = {
        buildForumPath: buildForumPath,
        buildTopicPath: buildTopicPath
    }
    const [role, setRole] = useState(UserRoleType.Viewer);

    const getUserRole = async (
        forum: DispatchForum,
        collectionId: web3.PublicKey,
        topic?: ForumPost
      ) => {
        if (isUndefined(topic)) {
            const [isMod, isOwner, canCreateTopic] = await Promise.all([
                forum.isModerator(collectionId),
                forum.isOwner(collectionId),
                forum.canCreateTopic(collectionId)
            ]);
            const value = isOwner
                ? UserRoleType.Owner
                : isMod
                ? UserRoleType.Moderator
                : canCreateTopic
                ? UserRoleType.Poster
                : UserRoleType.Viewer;
            setRole(value);
        } else {
            const [isMod, isOwner, canPost] = await Promise.all([
                forum.isModerator(collectionId),
                forum.isOwner(collectionId),
                forum.canPost(topic, collectionId)
            ]);
                const value = isOwner
                    ? UserRoleType.Owner
                    : isMod
                    ? UserRoleType.Moderator
                    : canPost
                    ? UserRoleType.Poster
                    : UserRoleType.Viewer;
                setRole(value);
        }
      };
      
    const userRole = {role, getUserRole}
    return (
        <ForumContext.Provider value={forum}>
            <PathContext.Provider value={paths}>
                <UserRoleContext.Provider value={userRole}>
                    {children}
                </UserRoleContext.Provider>
            </PathContext.Provider>
        </ForumContext.Provider>

    )
}


export function useRole(): UserObject {
    return useContext(UserRoleContext);
}

export function useForum(): DispatchForum {
    return useContext(ForumContext);
}

export function usePath(): PathObject {
    return useContext(PathContext);
}