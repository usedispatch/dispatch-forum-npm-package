import { getForumIdFromSolanartId, addSolanartMap } from '@usedispatch/client';
import { Cluster } from '@solana/web3.js';

export const getForumID = async (cluster: Cluster, forumId: string): Promise<string> => {
  const id = await getForumIdFromSolanartId(cluster, forumId);
  return id;
};

export const addSolanartIdToForum = async (cluster: Cluster, forumId: string, solanartId: string): Promise<void> => {
  await addSolanartMap(cluster, forumId, solanartId);
};
