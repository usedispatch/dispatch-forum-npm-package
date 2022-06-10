import { web3 } from '@project-serum/anchor';
import { WalletInterface } from '@usedispatch/client';
import { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { DispatchForum, MainForum } from './../utils/postbox/postboxWrapper';
// import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
// import { TopicView } from './../views/TopicView';

export interface DispatchAppProps {
    wallet: WalletInterface;
    connection: web3.Connection;
    children: ReactNode | ReactNode[];
    baseURL: string;
    forumURL: string;
    topicURL: string;
}

export interface PathObject {
    baseURL: string;
    forumURL: string;
    topicURL: string;
}

export const ForumContext = createContext<DispatchForum>({} as DispatchForum);
export const PathContext = createContext<PathObject>({} as PathObject);

export const DispatchProvider: FC<DispatchAppProps> = ({ 
    wallet, 
    connection, 
    children,
    baseURL,
    forumURL,
    topicURL
}) => {
    const forum = useMemo(() => new MainForum(wallet, connection), [wallet, connection])
    const paths = {
        baseURL: baseURL,
        forumURL: forumURL,
        topicURL: topicURL
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