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
  }, [data, collectionId]);

  async function fetchState(): Promise<Loading<ForumData>> {
    if (collectionId === null) { return { state: 'notFound' }; }
    try {
      const [desc, moderators, owners, posts] = await Promise.all([
        // TODO implement this as one function call
        forum.getDescription(collectionId),
        forum.getModerators(collectionId),
        forum.getOwners(collectionId),
        forum.getPostsForForum(collectionId)
      ]);

      if (desc && moderators && owners && posts) {
        return {
          state: 'success',
          value: {
            info: {
              collectionId,
              owners,
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
