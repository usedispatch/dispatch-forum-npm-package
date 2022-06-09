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
}

export const ForumContext = createContext<DispatchForum>({} as DispatchForum);

export const DispatchProvider: FC<DispatchAppProps> = ({ 
    wallet, 
    connection, 
    children 
}) => {
    // const Forum = new MainForum(wallet, connection);
    const forum = useMemo(() => new MainForum(wallet, connection), [wallet, connection]) //createContext(Forum);
    return (
            <ForumContext.Provider value={forum}>
                {/* <Router> */}
                    {children}
                    {/* <Routes>
                        <Route path="/" element={<ForumComponent/>} />
                        <Route path="/forum/:collectionID/topic/:topicID" element={<TopicView/>} />
                    </Routes>
                </Router> */}
            </ForumContext.Provider>

    )
}

export function useForum(): DispatchForum {
    return useContext(ForumContext);
}