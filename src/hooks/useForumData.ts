import { PublicKey } from '@solana/web3.js';
import { useState, useEffect } from 'react';
import { ForumPost, PostRestriction, ChainVoteEntry } from '@usedispatch/client';
import { Loading } from '../types/loading';
import { Result } from "../types/error";
import {
  initial,
  isInitial,
  isSuccess,
} from '../utils/loading';
import {
  isForumPost,
} from '../utils/forumData';
import { notFoundError } from '../utils/error';
import { parseError } from '../utils/parseErrors';
import {
  ForumData,
  CreatedPost,
  EditedPost
} from "../types/forumData";
import { Description } from '../types/postboxWrapper';
import { DispatchForum } from '@postbox';

// This hook returns all the necessary forum data and a function
// to refresh it
export function useForumData(
  collectionId: PublicKey | null,
  forum: DispatchForum
): {
  forumData: Loading<ForumData>;
  addPost: (post: CreatedPost) => void;
  deletePost: (post: ForumPost) => void;
  editPost: (post: ForumPost, newBody: string, newSubj?: string) => void;
  update: () => Promise<void>;
} {
  const [forumData, setForumData] = useState<Loading<ForumData>>(initial());

  useEffect(() => {
      if (isSuccess(forumData) && isInitial(forumData.votes)) {
        fetchVotes().then((votes) => {
        if (isSuccess(votes)) {
          setForumData({
            ...forumData,
            votes,
          });
        }
      });
      }
  }, [forum.wallet, forumData]);

  // TODO(andrew) make this more generic
  async function fetchOwners(): Promise<Result<PublicKey[]>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getOwners(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return notFoundError('The owners did not exist');
        }
      } catch (error) {
        return parseError(error);
      }
    } else {
      return notFoundError('The collectionId was not defined');
    }
  }

  async function fetchModeratorMint(): Promise<Result<PublicKey>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getModeratorMint(collectionId);
        if (fetchData) {
          return fetchData;
        } else {
          return notFoundError('The moderator mint did not exist');
        }
      } catch (error) {
        return parseError(error);
      }
    } else {
      return notFoundError('The collectionId was not defined');
    }
  }

  // TODO(andrew) when the moderators call is optimized, return
  // the fetchModerators() call to its place here

  async function fetchDescription(): Promise<Result<Description>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getDescription(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return notFoundError('The description was not defined');
        }
      } catch (error) {
        return parseError(error);
      }
    } else {
      return notFoundError('The collectionId was not defined');
    }
  }
  async function fetchPosts(): Promise<Result<ForumPost[]>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getPostsForForum(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return notFoundError('The posts could not be fetched');
        }
      } catch (error) {
        return parseError(error);
      }
    } else {
      return notFoundError('The collectionId was not defined');
    }
  }

  async function fetchForumPostRestriction(): Promise<
    Result<PostRestriction>
  > {
    if (collectionId) {
      try {
        const restriction = await forum.getForumPostRestriction(collectionId);
        if (restriction) {
          return restriction;
        } else {
          return notFoundError('The restriction was not defined');
        }
      } catch (error) {
        return parseError(error);
      }
    } else {
      return notFoundError('The collectionId was not defined');
    }
  }

  /**
   * create a post in local state, without sending anything to
   * the network
   */
  function addPost(post: CreatedPost) {
    // We can only add a post if the forum was actually loaded
    // successfully in the first place
    if (isSuccess(forumData)) {
      setForumData({
        ...forumData,
        posts: forumData.posts.concat(post)
      });
    }
  }

  function editPost(
    post: ForumPost,
    newBody: string,
    newSubj?: string
  ) {
    if (isSuccess(forumData)) {
      const { posts } = forumData;

      // Find all posts matching the one we want to edit
      const matchingPosts = posts.filter(p => {
        return isForumPost(p) && p.address.equals(post.address)
        // Cast to ForumPost here because we know p is a
        // ForumPost, but the typechecker doesn't
      }) as ForumPost[];

      // Should edit exactly one post
      if (matchingPosts.length !== 1) {
        // TODO(andrew) better error handling mechanism here than
        // throwing a string? Is there a way to report this more
        // descriptively?
        throw `Error in edit post: could not find exactly one post to be edited. Found ${matchingPosts.length}`;
      }

      const postToEdit = matchingPosts[0];

      const filteredPosts = posts.filter(p => {
        return p !== postToEdit
      });

      // Add the modified version of the post
      const editedPost: EditedPost = {
        ...postToEdit,
        data: {
          ts: postToEdit.data.ts,
          body: newBody,
          subj: newSubj
        },
        state: 'edited'
      };

      const editedPosts = filteredPosts.concat(editedPost);

      if (editedPosts.length !== posts.length) {
        throw 'Error in edit post: the same number of posts were not found before and after the posts were edited';
      }

      setForumData({
        ...forumData,
        posts: editedPosts
      });
    }
  }

  /**
   * Delete a post in the local state, without deleting on the
   * network. Only `ForumPost`s (i.e., posts that have been
   * confirmed on-chain) can be deleted
   */
  // Could also parameterize this by postId or public key.
  // Feel free to change as desired to filter by useful criteria
  function deletePost(post: ForumPost) {
    // We can only delete a post if the forum was actually loaded
    // successfully in the first place
    if (isSuccess(forumData)) {
      setForumData({
        ...forumData,
        posts: forumData.posts.filter(p => post !== p)
      });
    }
  }
  async function fetchVotes(): Promise<Result<ChainVoteEntry[]>> {
    if (collectionId && forum.permission.readAndWrite && isSuccess(forumData)) {
      try {
        const fetchData = await forum.getVotes(collectionId);
        if (fetchData) {
          return fetchData;
        } else {
          return notFoundError('The votes could not be found on-chain');
        }
      } catch (error) {
        return parseError(error);
      }
    } else {
      return notFoundError('The collection ID waas not defined');
    }
  }


  /**
   * re-fetch all data related to this forum from chain
   */
  async function update() {
    if (collectionId) {
      // Wait for the forum to exist first...
      if (await forum.exists(collectionId)) {
        // Now fetch all related data
        const [owners, description, posts, restriction, moderatorMint] =
          await Promise.all([
            fetchOwners(),
            fetchDescription(),
            fetchPosts(),
            fetchForumPostRestriction(),
            fetchModeratorMint(),
          ]);

        // TODO(andrew) perhaps allow the page to load even if
        // moderatorMint isn't fetched successfully?
        if (isSuccess(description) && isSuccess(posts) && isSuccess(moderatorMint)) {
          // If owners and moderators were successfully fetched, then
          // just set them and go
          setForumData({
            collectionId,
            owners,
            description,
            posts,
            restriction,
            moderatorMint,
            votes: initial(),
          });
        } else {
          // We already confirmed the forum existed, so assume
          // there was a failure in loading
          setForumData(notFoundError('One or more of description, posts, and moderatorMint could not be fetched'));
        }
      } else {
        setForumData(notFoundError('The forum did not exist'));
      }
    } else {
      // TODO(andrew) make collectionId nonnull
      setForumData(notFoundError('The collectionId was not defined'));
    }
  }
  return {
    forumData,
    addPost,
    deletePost,
    editPost,
    update,
  };
}
