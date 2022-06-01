import React, { FC, ReactNode, useMemo, createContext, useContext } from 'react';
import { Cluster, Connection, ConnectionConfig } from '@solana/web3.js';
import { useClusterAndSetter } from 'contexts/ClusterProvider';

// Consider https://ssc-dao.genesysgo.net
export const getEndpoint = (cluster: Cluster): string => {
    if (cluster === "mainnet-beta") return "https://solana-mainnet.phantom.tech";
    return "https://api.devnet.solana.com";
}

export interface ConnectionContextState {
    connection: Connection;
}

export const ConnectionContext = createContext<ConnectionContextState>({} as ConnectionContextState);

export interface ConnectionProviderProps {
    children: ReactNode;
    config?: ConnectionConfig;
}

export const ConnectionProvider: FC<ConnectionProviderProps> = ({
    children,
    config = { commitment: 'confirmed' },
}) => {
    const { cluster } = useClusterAndSetter();
    const endpoint = getEndpoint(cluster);
    const connection = useMemo(() => new Connection(endpoint, config), [endpoint, config]);

    return <ConnectionContext.Provider value={{ connection }}>{children}</ConnectionContext.Provider>;
};

export function useConnection(): ConnectionContextState {
    return useContext(ConnectionContext);
}
