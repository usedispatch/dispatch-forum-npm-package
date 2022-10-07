import { getForumIdFromSolanartId } from '@usedispatch/client';
import { Cluster } from '@solana/web3.js';

export const getForumID = async (cluster: Cluster, forumID: string): Promise<string> => {
  const id = await getForumIdFromSolanartId(cluster, forumID);
  return id;
};
