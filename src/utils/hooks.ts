import { useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ForumInfo, ForumPost } from '@usedispatch/client';
import { Loading } from '../types/loading';
import { DispatchForum } from './postbox/postboxWrapper';

export interface ForumData {
  info: ForumInfo;
  posts: ForumPost[];
}

// This hook returns all the necessary forum data and a function
// to refresh it
export function useForumData(
  collectionId: PublicKey | null,
  forum: DispatchForum
): {
  forumData: Loading<ForumData>
  update: () => Promise<void>;
} {
  const [data, setData] = useState<Loading<ForumData>>({ state: 'initial' });
  const forumData = useMemo(() => {
    return data;
  }, [data]);

  async function fetchState(): Promise<Loading<ForumData>> {
    if (collectionId === null) { return { state: 'initial' }; }
    try {
      const [desc, moderators, posts] = await Promise.all([
        forum.getDescription(collectionId),
        forum.getModerators(collectionId),
        forum.getPostsForForum(collectionId)
      ]);

      if (desc && moderators && posts) {
        return {
          state: 'success',
          value: {
            info: {
              collectionId,
              owners: forum.wallet.publicKey ? [forum.wallet.publicKey] : [],
              moderators,
              title: desc.title,
              description: desc.desc
            },
            posts
          }
        }
      } else {
        return { state: 'notFound' };
      }
    } catch (e: any) {
      return {
        state: 'failed',
        error: e
      };
    }
  }

  const update = async () => {
    setData({ state: 'pending' });
    const nextState = await fetchState();
    setData(nextState);
  };

  return { forumData, update };
}