import { PublicKey } from '@solana/web3.js';
import { newPublicKey, isSuccess } from 'utils';

export function csvStringToPubkeyList(pubkeyList: string): PublicKey[] {
  const tokenCSV = pubkeyList.replace(/\s+/g, "");
  const csvList = tokenCSV.split(",");
  let newIdResults = csvList.map((token) => {
    return newPublicKey(token);
  });

  const newIds = newIdResults.filter(result => {
    if (isSuccess(result)) {
      return true;
    } else {
      // If result is an error, print it and return false
      console.error(result);
      return false;
    }
  }) as PublicKey[];

  return newIds;
}
