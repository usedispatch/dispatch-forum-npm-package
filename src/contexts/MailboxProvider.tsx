import { createContext, useContext, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Mailbox } from '@usedispatch/client';
import { useConnection } from "contexts/ConnectionProvider";
import { useClusterAndSetter } from "contexts/ClusterProvider";

const MailboxContext = createContext<Mailbox | undefined>(undefined);

type MailboxProviderProps = {
    children: React.ReactNode;
}

export const MailboxProvider = (props: MailboxProviderProps): JSX.Element => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const [mailbox, setMailbox] = useState<Mailbox>();
    const cluster = useClusterAndSetter().cluster;

    useEffect(() => {
        if (!wallet.publicKey) {
            return;
        }
        setMailbox(new Mailbox(connection, wallet, { cluster }));
    }, [connection, wallet.publicKey, cluster]);

    return (
        <MailboxContext.Provider value={mailbox}>
            {props.children}
        </MailboxContext.Provider>
    );
}

export const useMailbox = () => useContext(MailboxContext);
