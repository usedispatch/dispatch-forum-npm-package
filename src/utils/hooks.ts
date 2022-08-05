import { useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { ForumInfo, ForumPost } from '@usedispatch/client';
import { Loading, LoadingResult } from '../types/loading';
import {
  isResolved,
  success,
  isNotFound
} from '../utils/loading';
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
          setOwners(success(fetchData));
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
          setModerators(success(fetchData));
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
          setDescription(success(fetchData));
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
          setPosts(success(fetchData));
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
      if (
        isResolved(owners) &&
        isResolved(moderators) &&
        isResolved(description) &&
        isResolved(posts)
      ) {
        // If all resolved information is not defined, the forum
        // must not be defined.
        // TODO(andrew) better logic for actually determining if
        // the forum is defined? Ideally we would want to check
        // if the forum account exists
        if (
          isNotFound(owners) &&
          isNotFound(moderators) &&
          isNotFound(description) &&
          isNotFound(posts)
        ) {
          return { state: 'onChainAccountNotFound' };
        } else {
          return {
            state: 'success',
            collectionId,
            owners,
            moderators,
            description,
            posts
          };
        }
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
