import { getForumIdFromSolanartId, addSolanartMap } from '@usedispatch/client';
import { Cluster, PublicKey } from '@solana/web3.js';

export const getForumID = async (cluster: Cluster, solanartId: string): Promise<string> => {
  const id = await getForumIdFromSolanartId(cluster, solanartId);
  return id;
};

export const addSolanartIdToForum = async (cluster: Cluster, forumId: string, solanartId: PublicKey): Promise<void> => {
  await addSolanartMap(cluster, forumId, solanartId);
};
