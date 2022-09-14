import { PublicKey } from '@solana/web3.js';
import { newPublicKey } from "./postbox/validateNewPublicKey";

export function csvStringToPubkeyList(pubkeyList: string): PublicKey[] {
    const tokenCSV = pubkeyList.replace(/\s+/g, "");
    const csvList = tokenCSV.split(",");
    let newIds = csvList.map((token) => {
        return newPublicKey(token);
      });
    return newIds;
}
