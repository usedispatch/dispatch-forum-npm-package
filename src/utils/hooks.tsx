import { useMemo, useState, useEffect, ReactNode } from "react";
import { PublicKey, AccountInfo } from "@solana/web3.js";
import { ForumInfo, ForumPost, PostRestriction, getAccountsInfoPaginated } from "@usedispatch/client";
import { uniqBy, zip, isNil } from 'lodash';
import {
  getAssociatedTokenAddress,
  unpackAccount,
  Account
} from '@solana/spl-token';
import { Loading, LoadingResult } from "../types/loading";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
} from "../components/common";
import {
  isResolved,
  isNotFound,
  initial,
  pending,
  onChainAccountNotFound,
  dispatchClientError,
  isSuccess,
  isDispatchClientError,
} from "../utils/loading";
import { DispatchForum } from "./postbox/postboxWrapper";

// TODO(andrew) move this to DispatchForum.getDescription()
// so that function can be properly typed
export interface Description {
  title: string;
  desc: string;
}

/**
 * A post that is created locally, but has not yet been confirmed
 * on-chain. Should not be allowed to be interacted with
 */
export type CreatedPost = Pick<
  ForumPost
  , 'data'
  | 'replyTo'
  | 'isTopic'
  | 'poster'
> & { state: 'created' };

/**
 * A post that has been edited locally, but the edit nas not yet
 * ben confirmed on-chain. Should not be able to be interacted
 * with. Unlike a CreatedPost, this type has an `address`, which
 * is the existing address of the post being edited
 */
export type EditedPost
  = ForumPost
  & { state: 'edited' };

/**
 * Any kind of post that can be held in the client state. This
 * can be a full-fledged ForumPost, a CreatedPost that has not
 * been confirmed yet, or an EditedPost that already exists
 * on-chain  but has been edited.
 */
export type ClientPost
  = ForumPost
  | CreatedPost
  | EditedPost;

export function isForumPost(
  post: ClientPost
): post is ForumPost {
  // A post is a LocalPost if it has an associated parent object
  // TODO(andrew) confirm that this is the best field to check
  return !('state' in post);
}

export function isEditedPost(
  post: ClientPost
): post is EditedPost {
  // A post is an edited post if it's not a ForumPost, but it
  // does have an address
  return 'state' in post && post.state === 'edited';
}

export function isCreatedPost(
  post: ClientPost
): post is CreatedPost {
  // A post is a client post if it doesn't have the address field
  return 'state' in post && post.state === 'created';
}

export interface ForumData {
  collectionId: PublicKey;
  owners: LoadingResult<PublicKey[]>;
  // TODO(andrew) if/when we optimize moderators, return this
  // field to the main forum data hook
  // moderators: LoadingResult<PublicKey[]>;
  description: Description;
  posts: ClientPost[];
  restriction: LoadingResult<PostRestriction>;
  moderatorMint: PublicKey;
}

// This hook returns all the necessary forum data and a function
// to refresh it
export function useForumData(
  collectionId: PublicKey | null,
  forum: DispatchForum
): {
  forumData: Loading<ForumData>;
  addPost: (post: CreatedPost) => void;
  deletePost: (post: ForumPost) => void;
  editPost: (post: ForumPost, newText: string) => void;
  update: () => Promise<void>;
} {
  const [forumData, setForumData] = useState<Loading<ForumData>>(initial());

  // TODO(andrew) make this more generic
  async function fetchOwners(): Promise<LoadingResult<PublicKey[]>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getOwners(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
    }
  }

  async function fetchModeratorMint(): Promise<LoadingResult<PublicKey>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getModeratorMint(collectionId);
        if (fetchData) {
          return fetchData;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
    }
  }

  // TODO(andrew) when the moderators call is optimized, return
  // the fetchModerators() call to its place here

  async function fetchDescription(): Promise<LoadingResult<Description>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getDescription(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
    }
  }
  async function fetchPosts(): Promise<LoadingResult<ForumPost[]>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getPostsForForum(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
    }
  }

  async function fetchForumPostRestriction(): Promise<
    LoadingResult<PostRestriction>
  > {
    if (collectionId) {
      try {
        const restriction = await forum.getForumPostRestriction(collectionId);
        if (restriction) {
          return restriction;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
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
    post: ForumPost, newText: string
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
          body: newText,
          ts: postToEdit.data.ts
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
            moderatorMint
          });
        } else {
          // We already confirmed the forum existed, so assume
          // there was a failure in loading
          setForumData(dispatchClientError());
        }
      } else {
        setForumData(onChainAccountNotFound());
      }
    } else {
      // TODO(andrew) make collectionId nonnull
      setForumData(onChainAccountNotFound());
    }
  }
  return {
    forumData,
    addPost,
    deletePost,
    editPost,
    update
  };
}

export function useModerators(
  collectionId: PublicKey | null,
  forum: DispatchForum
): {
  moderators: Loading<PublicKey[]>,
    update: () => Promise<void>
} {
  const [moderators, setModerators] = useState<Loading<PublicKey[]>>(initial());

  async function fetchModerators(): Promise<LoadingResult<PublicKey[]>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getModerators(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return onChainAccountNotFound();
        }
      } catch (error) {
        return dispatchClientError(error);
      }
    } else {
      return onChainAccountNotFound();
    }
  }

  async function update() {
    if (collectionId) {
      if (await forum.exists(collectionId)) {
        const fetchResult = await fetchModerators();
        setModerators(fetchResult);
      }
    }
  }

  return { moderators, update };
}

export interface ModalInfo {
  title: string | ReactNode;
  type: MessageType;
  body?: string | ReactNode;
  collapsible?: CollapsibleProps;
}

export function useModal() {
  const [modalInfoList, setModalInfoList] = useState<ModalInfo[]>([]);

  // Enqueue one or more modals to show. Modals are shown in FIFO
  // order
  function showModals(modalsToAdd: ModalInfo[]) {
    setModalInfoList(modalInfoList.concat(modalsToAdd));
  }

  function showModal(modalToAdd: ModalInfo) {
    showModals([modalToAdd]);
  }

  // Close the current modal
  function close() {
    // Pop the first element of the array
    setModalInfoList(modalInfoList.slice(1));
  }

  const modal = useMemo(() => {
    if (modalInfoList.length > 0) {
      const modalInfo = modalInfoList[0];
      return (
        <PopUpModal
          id="create-forum-info"
          visible
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={modalInfo.body}
          collapsible={modalInfo.collapsible}
          okButton={
            <a className="okInfoButton" onClick={close}>
              OK
            </a>
          }
        />
      );
    } else {
      return null;
    }
  }, [modalInfoList]);

  return {
    // The component which can be rendered in react
    modal,
    // a function to close the current modal
    close,
    // functions to show a current modal or modals
    showModal,
    showModals,
    setModals: setModalInfoList,
  };
}

/*
 * Of the posters participating in this forum, return the set of
 * them that are moderators
 */
export function useParticipatingModerators(
  forumData: Loading<ForumData>,
  forum: DispatchForum
) {

  // TODO make this a result type/
  const [moderators, setModerators] = useState<PublicKey[] | null>(null);

  async function fetchParticipatingModerators(
    forumData: ForumData
  ) {
    const { moderatorMint } = forumData;

    // Fetch the authors of all posts, unique by base58 key
    const authors = uniqBy(
      forumData.posts.map(({ poster }) => poster),
      (pkey) => pkey.toBase58()
    );

    // Derive associated token accounts
    const atas = await Promise.all(authors.map(author => {
      return getAssociatedTokenAddress(moderatorMint, author);
    }));

    // Fetch the accounts
    const binaryAccounts = await getAccountsInfoPaginated(
      forum.connection, atas
    );

    const pairs = zip(authors, atas, binaryAccounts);

    // Filter out the nulls
    const nonnullPairs = pairs.filter(([wallet, ata, account]) => {
      return !isNil(wallet) && !isNil(ata) && !isNil(account);
    }) as [PublicKey, PublicKey, AccountInfo<Buffer>][];

    // Parse the accounts
    const parsedAccounts: [PublicKey, PublicKey, Account][] = nonnullPairs.map(([wallet, ata, account]) => {
      const unpacked = unpackAccount(ata, account);
      return [wallet, ata, unpacked];
    });

    // Filter out only the ones that hold the token
    const tokenHolders = parsedAccounts.filter(([/* skip */, /* skip */, account]) => {
      return account.amount > 0
    });

    const tokenHoldingWallets = tokenHolders.map(([wallet]) => wallet);

    return tokenHoldingWallets;
  }

  useEffect(() => {
    if (isSuccess(forumData)) {
      fetchParticipatingModerators(forumData)
        .then((moderators) => setModerators(moderators));
    }
  }, [forumData]);

  return moderators;
}
