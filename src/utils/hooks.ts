import { useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ForumInfo, ForumPost } from '@usedispatch/client';
import { Loading, LoadingResult } from '../types/loading';
import { resolved } from '../utils/loading';
import { DispatchForum } from './postbox/postboxWrapper';

// TODO(andrew) move this to DispatchForum.getDescription()
// so that function can be properly typed
export interface Description {
  title: string;
  desc: string;
}

export interface ForumData {
  collectionId: PublicKey;
  owners: LoadingResult<PublicKey[]>;
  moderators: LoadingResult<PublicKey[]>;
  description: LoadingResult<Description>;
  posts: LoadingResult<ForumPost[]>;
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

  const [owners, setOwners] = useState<Loading<PublicKey[]>>({ state: 'initial' });
  // TODO(andrew) make this more generic
  async function updateOwners() {
    if (collectionId) {
      try {
        const fetchData = await forum.getOwners(collectionId);
        if (fetchData) {
          setOwners({ state: 'success', value: fetchData });
        } else {
          setOwners({ state: 'onChainAccountNotFound' });
        }
      } catch (error) {
        setOwners({ state: 'dispatchClientError', error });
      }
    } else {
      setOwners({ state: 'onChainAccountNotFound' })
    }
  }
  const [moderators, setModerators] = useState<Loading<PublicKey[]>>({ state: 'initial' });
  async function updateModerators() {
    if (collectionId) {
      try {
        const fetchData = await forum.getModerators(collectionId);
        if (fetchData) {
          setModerators({ state: 'success', value: fetchData });
        } else {
          setModerators({ state: 'onChainAccountNotFound' });
        }
      } catch (error) {
        setModerators({ state: 'dispatchClientError', error });
      }
    } else {
      setModerators({ state: 'onChainAccountNotFound' })
    }
  }
  const [description, setDescription] = useState<Loading<Description>>({ state: 'initial' });
  async function updateDescription() {
    if (collectionId) {
      try {
        const fetchData = await forum.getDescription(collectionId);
        if (fetchData) {
          setDescription({ state: 'success', value: fetchData });
        } else {
          setDescription({ state: 'onChainAccountNotFound' });
        }
      } catch (error) {
        setDescription({ state: 'dispatchClientError', error });
      }
    } else {
      setDescription({ state: 'onChainAccountNotFound' })
    }
  }
  const [posts, setPosts] = useState<Loading<ForumPost[]>>({ state: 'initial' });
  async function updatePosts() {
    if (collectionId) {
      try {
        const fetchData = await forum.getPostsForForum(collectionId);
        if (fetchData) {
          setPosts({ state: 'success', value: fetchData });
        } else {
          setPosts({ state: 'onChainAccountNotFound' });
        }
      } catch (error) {
        setPosts({ state: 'dispatchClientError', error });
      }
    } else {
      setPosts({ state: 'onChainAccountNotFound' })
    }
  }

  const forumData: Loading<ForumData> = useMemo(() => {
    console.log('re-rendering forum data');
    if (collectionId) {
      const resolvedOwners = resolved(owners);
      const resolvedModerators = resolved(moderators);
      const resolvedDescription = resolved(description);
      const resolvedPosts = resolved(posts);
      if (
        resolvedOwners &&
        resolvedModerators &&
        resolvedDescription &&
        resolvedPosts
      ) {
        return {
          state: 'success',
          value: {
            collectionId,
            owners: resolvedOwners,
            moderators: resolvedModerators,
            description: resolvedDescription,
            posts: resolvedPosts
          }
        };
      } else {
        return { state: 'pending' };
      }
    } else {
      return { state: 'initial' }
    }
  }, [owners, moderators, description, posts, collectionId]);

  async function update() {
    console.log('updating');
    await Promise.all([
      updateOwners(),
      updateModerators(),
      updateDescription(),
      updatePosts()
    ]);
  }

  return { forumData, update };
}
