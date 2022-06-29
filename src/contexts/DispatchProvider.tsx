import { web3 } from '@project-serum/anchor';
import { WalletInterface } from '@usedispatch/client';
import { FC, ReactNode, createContext, useContext, useMemo } from 'react';
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

export interface PathObject {
    buildForumPath: typeof ForumPathFunction;
    buildTopicPath: typeof TopicPathFunction;
}

export const ForumContext = createContext<DispatchForum>({} as DispatchForum);
export const PathContext = createContext<PathObject>({} as PathObject);

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
    
    return (
            <ForumContext.Provider value={forum}>
                <PathContext.Provider value={paths}>
                    {children}
                </PathContext.Provider>
            </ForumContext.Provider>

    )
}

export function useForum(): DispatchForum {
    return useContext(ForumContext);
}

export function usePath(): PathObject {
    return useContext(PathContext);
}