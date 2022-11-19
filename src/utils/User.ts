import { CivicProfile, Profile } from '@civic/profile';
import { Cluster, Connection } from '@solana/web3.js';
import { DispatchConnection, WalletInterface } from '@usedispatch/client';

export class User {
  public wallet: WalletInterface;

  public dispatchConnection: DispatchConnection;

  private did: Profile | undefined;

  //   private readonly name: string;

  //   private readonly username: string;

  //   private readonly walletConnected: boolean;

  //   private readonly twitterConnected: boolean;

  //   private readonly twitterUsername: string;

  constructor(wallet: WalletInterface, connection: Connection, cluster: Cluster) {
    this.wallet = wallet;
    this.dispatchConnection = new DispatchConnection(connection, wallet, { cluster });
    void CivicProfile.get(wallet.publicKey.toBase58())
      .then((profile) => {
        this.did = profile;
        console.log(profile);
      })
      .catch((err) => {
        this.did = undefined;
        console.error(err);
      });
  }
}
