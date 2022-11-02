import { useMemo, useState, useEffect, ReactNode } from 'react';
import { PublicKey, AccountInfo, clusterApiUrl } from '@solana/web3.js';
import {
  ForumInfo,
  ForumPost,
  PostRestriction,
  getAccountsInfoPaginated,
  ChainVoteEntry,
} from '@usedispatch/client';
import uniqBy from 'lodash/uniqBy';
import zip from 'lodash/zip';
import isNil from 'lodash/isNil';
import {
  getAssociatedTokenAddress,
  unpackAccount,
  Account,
} from '@solana/spl-token';
import { Loading } from '../types/loading';
import { Result } from '../types/error';
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
} from '../components/common';
import { initial, isInitial, isSuccess } from '../utils/loading';
import { parseError } from '../utils/parseErrors';
import { notFoundError } from '../utils/error';
import { DispatchForum } from './postbox/postboxWrapper';
import { WebBundlr } from '@bundlr-network/client';
import { useForum } from '../contexts/DispatchProvider';

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
ForumPost,
'data' | 'replyTo' | 'isTopic' | 'poster'
> & { state: 'created' };

/**
 * A post that has been edited locally, but the edit nas not yet
 * ben confirmed on-chain. Should not be able to be interacted
 * with. Unlike a CreatedPost, this type has an `address`, which
 * is the existing address of the post being edited
 */
export type EditedPost = ForumPost & { state: 'edited' };

/**
 * Any kind of post that can be held in the client state. This
 * can be a full-fledged ForumPost, a CreatedPost that has not
 * been confirmed yet, or an EditedPost that already exists
 * on-chain  but has been edited.
 */
export type ClientPost = ForumPost | CreatedPost | EditedPost;

export function isForumPost(post: ClientPost): post is ForumPost {
  // A post is a LocalPost if it has an associated parent object
  // TODO(andrew) confirm that this is the best field to check
  return !('state' in post);
}

export function isEditedPost(post: ClientPost): post is EditedPost {
  // A post is an edited post if it's not a ForumPost, but it
  // does have an address
  return 'state' in post && post.state === 'edited';
}

export function isCreatedPost(post: ClientPost): post is CreatedPost {
  // A post is a client post if it doesn't have the address field
  return 'state' in post && post.state === 'created';
}

export interface ForumData {
  collectionId: PublicKey;
  owners: Result<PublicKey[]>;
  // TODO(andrew) if/when we optimize moderators, return this
  // field to the main forum data hook
  // moderators: LoadingResult<PublicKey[]>;
  description: Description;
  posts: ClientPost[];
  restriction: Result<PostRestriction>;
  moderatorMint: PublicKey;
  votes: Loading<ChainVoteEntry[]>;
  images: any;
}

// This hook returns all the necessary forum data and a function
// to refresh it
export function useForumData(
  collectionId: PublicKey | null,
  forum: DispatchForum,
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
      fetchVotes().then(votes => {
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
  async function fetchForumImage(): Promise<any> {
    if (collectionId) {
      try {
        const imgs = await forum.getImageUrls(collectionId);
        if (imgs) {
          return imgs;
        } else {
          return notFoundError('The banner could not be fetched');
        }
      } catch (error: any) {
        return parseError(error);
      }
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

  async function fetchForumPostRestriction(): Promise<Result<PostRestriction>> {
    if (collectionId) {
      try {
        const restriction = await forum.getForumPostRestriction(collectionId);
        if (restriction != null) {
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
        posts: forumData.posts.concat(post),
      });
    }
  }

  function editPost(post: ForumPost, newBody: string, newSubj?: string) {
    if (isSuccess(forumData)) {
      const { posts } = forumData;

      // Find all posts matching the one we want to edit
      const matchingPosts = posts.filter(p => {
        return isForumPost(p) && p.address.equals(post.address);
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
        return p !== postToEdit;
      });

      // Add the modified version of the post
      const editedPost: EditedPost = {
        ...postToEdit,
        data: {
          ts: postToEdit.data.ts,
          body: newBody,
          subj: newSubj,
        },
        state: 'edited',
      };

      const editedPosts = filteredPosts.concat(editedPost);

      if (editedPosts.length !== posts.length) {
        throw 'Error in edit post: the same number of posts were not found before and after the posts were edited';
      }

      setForumData({
        ...forumData,
        posts: editedPosts,
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
        posts: forumData.posts.filter(p => post !== p),
      });
    }
  }
  async function fetchVotes(): Promise<Result<ChainVoteEntry[]>> {
    if ((collectionId) && forum.permission.readAndWrite && isSuccess(forumData)) {
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
        const [owners, description, posts, restriction, moderatorMint, images] =
          await Promise.all([
            fetchOwners(),
            fetchDescription(),
            fetchPosts(),
            fetchForumPostRestriction(),
            fetchModeratorMint(),
            fetchForumImage(),
          ]);

        // TODO(andrew) perhaps allow the page to load even if
        // moderatorMint isn't fetched successfully?
        if (
          isSuccess(description) &&
          isSuccess(posts) &&
          isSuccess(moderatorMint)
        ) {
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
            images,
          });
        } else {
          // We already confirmed the forum existed, so assume
          // there was a failure in loading
          setForumData(
            notFoundError(
              'One or more of description, posts, and moderatorMint could not be fetched',
            ),
          );
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

export function useModerators(
  collectionId: PublicKey | null,
  forum: DispatchForum,
): {
    moderators: Loading<PublicKey[]>;
    update: () => Promise<void>;
  } {
  const [moderators, setModerators] = useState<Loading<PublicKey[]>>(initial());

  async function fetchModerators(): Promise<Result<PublicKey[]>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getModerators(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return notFoundError('The moderators were not defined');
        }
      } catch (error) {
        return parseError(error);
      }
    } else {
      return notFoundError('The collectionId was not defined');
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
          onClose={close}
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
  forum: DispatchForum,
) {
  // TODO make this a result type/
  const [moderators, setModerators] = useState<PublicKey[] | null>(null);

  async function fetchParticipatingModerators(forumData: ForumData) {
    const { moderatorMint } = forumData;

    // Fetch the authors of all posts, unique by base58 key
    const authors = uniqBy(
      forumData.posts.map(({ poster }) => poster),
      pkey => pkey.toBase58(),
    );

    // Derive associated token accounts
    const atas = await Promise.all(
      authors.map(async author => {
        return getAssociatedTokenAddress(moderatorMint, author);
      }),
    );

    // Fetch the accounts
    const binaryAccounts = await getAccountsInfoPaginated(
      forum.connection,
      atas,
    );

    const pairs = zip(authors, atas, binaryAccounts);

    // Filter out the nulls
    const nonnullPairs = pairs.filter(([wallet, ata, account]) => {
      return !isNil(wallet) && !isNil(ata) && !isNil(account);
    }) as Array<[PublicKey, PublicKey, AccountInfo<Buffer>]>;

    // Parse the accounts
    const parsedAccounts: Array<[PublicKey, PublicKey, Account]> = nonnullPairs.map(
      ([wallet, ata, account]) => {
        const unpacked = unpackAccount(ata, account);
        return [wallet, ata, unpacked];
      },
    );

    // Filter out only the ones that hold the token
    const tokenHolders = parsedAccounts.filter(
      ([, , /* skip */ /* skip */ account]) => {
        return account.amount > 0;
      },
    );

    const tokenHoldingWallets = tokenHolders.map(([wallet]) => wallet);

    return tokenHoldingWallets;
  }

  useEffect(() => {
    if (isSuccess(forumData)) {
      fetchParticipatingModerators(forumData).then(moderators =>
        setModerators(moderators),
      );
    }
  }, [forumData]);

  return moderators;
}

/**
 * This hook returns whether the given user is a moderator for a
 * given forum. The hook returns true if the user is a mod, false
 * if the user is not a mod, or null if whether the user is a mod
 * or not has not been confirmed yet.
 * TODO(andrew): should there be better typing on this?
 */
export function useUserIsMod(
  /** The forum identifier, not to be confused with the collection identifier */
  forumId: PublicKey,
  /** The forum object, used for getting the moderator mint */
  forum: DispatchForum,
  /** The user's wallet public key */
  userPublicKey: PublicKey,
): boolean | null {
  // At first, we don't know whether the user is a mod, so set to
  // null
  const [userIsMod, setUserIsMod] = useState<boolean | null>(null);

  // We want to check if the user holds the token associated with
  // the forum
  async function fetchUserIsMod(): Promise<boolean> {
    const moderatorMint = await forum.getModeratorMint(forumId);
    // only continue if the moderator mint is actually defined
    if (isSuccess(moderatorMint)) {
      const ataAddress = await getAssociatedTokenAddress(
        moderatorMint,
        userPublicKey,
      );
      const ataBinary = await forum.connection.getAccountInfo(ataAddress);
      if (ataBinary != null) {
        const parsedAta = unpackAccount(ataAddress, ataBinary);
        if (parsedAta.amount > 0) {
          return true;
        } else {
          // If balance is not positive, user is not a mod
          return false;
        }
      } else {
        // If the account could not be fetched, user is not a mod
        // TODO(andrew) should this be an error case?
        return false;
      }
    } else {
      // If the moderator mint is somehow not defined, the user
      // is not a mod
      // TODO(andrew) if the moderator mint isn't defined, is
      // everyone a mod? Or is everyone not a mod?
      return false;
    }
  }

  useEffect(() => {
    // Fetch whether the user is a mod, then set the state
    // variable to that value
    if (userIsMod === null) {
      fetchUserIsMod().then(b => setUserIsMod(b));
    }
  }, [forumId, userPublicKey]);

  return userIsMod;
}

/**
 * If a forum was created for a particular client, we can keep
 * track of it here
 */
export enum ForumIdentity {
  DegenerateApeAcademy,
}

/**
 * Return the identity of a particular forum, or `null` if it
 * doesn't have one
 */
export function useForumIdentity(forumId: PublicKey): ForumIdentity | null {
  return useMemo(() => {
    if (
      forumId.equals(
        // TODO(andrew) put this in a constant somewhere? it is
        // nice to have it literally specified at the point of use
        // to avoid confusion
        new PublicKey('DSwfRF1jhhu6HpSuzaig1G19kzP73PfLZBPLofkw6fLD'),
      )
    ) {
      return ForumIdentity.DegenerateApeAcademy;
    } else {
      return null;
    }
  }, [forumId]);
}

export function useBundlr(): WebBundlr | null {
  const forum = useForum();

  return useMemo(() => {

    // Assume that if we're using devnet, it will be the standard
    // public Solana devnet endpoint. If so, use the bundlr
    // devnet endpoint, if so use the bundlr mainnet
    const bundlrEndpoint = forum.connection.rpcEndpoint.includes('devnet')
      ? 'https://devnet.bundlr.network'
      : 'http://node1.bundlr.network';

    if (forum.wallet.wallet) {
      const bundlr = new WebBundlr(
        bundlrEndpoint,
        'solana',
        forum.wallet.wallet.adapter,
        { providerUrl: forum.connection.rpcEndpoint }
      );

      return bundlr;
    } else {
      return null;
    }
  }, [forum.connection.rpcEndpoint, forum.wallet.wallet?.adapter]);
}
