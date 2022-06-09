import { web3 } from '@project-serum/anchor';
import { WalletInterface } from '@usedispatch/client';
import { FC, ReactNode, createContext, useContext, useMemo } from 'react';
import { DispatchForum, MainForum } from './../utils/postbox/postboxWrapper';


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
            {children}
        </ForumContext.Provider>
    )
}

export function useForum(): DispatchForum {
    return useContext(ForumContext);
}