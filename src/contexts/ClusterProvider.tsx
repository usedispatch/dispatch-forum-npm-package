import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as web3 from "@solana/web3.js";

import {useLocalStorage} from "utils/useLocalStorage"
 
const defaultCluster: web3.Cluster = "devnet";

type ClusterAndSetter = {
    cluster: web3.Cluster;
    setCluster: (cluster: web3.Cluster) => void;
};

const ClusterContext = createContext<ClusterAndSetter>({
    cluster: defaultCluster,
    setCluster: (cluster: web3.Cluster) => {},
});

type Props = {
    children: React.ReactNode;
}

export const ClusterProvider = (props: Props): JSX.Element => {
    const [selectedCluster, setSelectedCluster] = useLocalStorage("selectedCluster", defaultCluster);

    return (
        <ClusterContext.Provider value={{cluster: selectedCluster as web3.Cluster, setCluster: setSelectedCluster}}>
            {props.children}
        </ClusterContext.Provider>
    );
}

export const useClusterAndSetter = () => {
    return useContext(ClusterContext);
}
