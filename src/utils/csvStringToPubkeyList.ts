import { web3 } from "@project-serum/anchor";
import { newPublicKey } from "./postbox/validateNewPublicKey";

export function csvStringToPubkeyList(pubkeyList: string): web3.PublicKey[] {
    const tokenCSV = pubkeyList.replace(/\s+/g, "");
    const csvList = tokenCSV.split(",");
    let newIds = csvList.map((token) => {
        return newPublicKey(token);
      });
    return newIds;
}