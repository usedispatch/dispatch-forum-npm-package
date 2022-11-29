import {
  ChainVoteEntry,
  DispatchConnection,
  Forum,
  ForumInfo,
  ForumPost,
  PostRestriction,
  VoteType,
  WalletInterface,
  getMetadataForOwner,
  getMintsForOwner,
} from '@usedispatch/client';
import { Cluster, Connection, PublicKey, Transaction } from '@solana/web3.js';
import { DispatchError, Result } from '../../types/error';
import { badInputError, notFoundError } from '../../utils/error';
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from '@solana/spl-token';

import { User } from '../../utils/User';
import { isSuccess } from '../../utils/loading';
import { parseError } from '../parseErrors';
import { stringToURL } from '../../utils/url';

enum UserCategory {
  moderator,
  owner,
  poster,
}

/**
 * A token that can be displayed in the UI
 *
 * TODO(andrew) move this type definition into the types
 * directory under a suitable filename
 */
export interface DisplayableToken {
  name: string;
  mint: PublicKey;
  uri: URL;
}

export interface IForum {
  // For a given collection ID, only one postbox can exist
  getForumForCollection: (collectionId: PublicKey) => Promise<Result<Forum>>;

  isOwner: (collectionId: PublicKey) => Promise<boolean>;

  isModerator: (collectionId: PublicKey) => Promise<boolean>;

  // Return whether the given forum exists or not
  exists: (collectionPublicKey: PublicKey) => Promise<boolean>;

  // Create a postbox for a given collection ID
  createForum: (
    forumInfo: ForumInfo,
  ) => Promise<Result<{ forum: Forum; txs: string[] }>>;

  // Get the description of the forum: title and blurb
  getDescription: (collectionId: PublicKey) => Promise<
  Result<{
    title: string;
    desc: string;
  }>
  >;

  setImageUrls: (
    collectionId: PublicKey,
    image: string,
  ) => Promise<Result<string>>;

  getImageUrls: (collectionId: PublicKey) => Promise<Result<any>>;

  getModeratorMint: (
    collectionId: PublicKey,
    assumeExists?: boolean,
  ) => Promise<Result<PublicKey>>;

  setDescription: (
    collectionId: PublicKey,
    desc: {
      title: string;
      desc: string;
    },
  ) => Promise<Result<string>>;

  addModerator: (
    newMod: PublicKey,
    collectionId: PublicKey,
  ) => Promise<Result<string>>;

  setOwners: (
    newOwners: PublicKey[],
    collectionId: PublicKey,
  ) => Promise<Result<string>>;

  // Get a list of moderators
  getModerators: (collectionId: PublicKey) => Promise<Result<PublicKey[]>>;

  // Get a list of owners
  getOwners: (collectionId: PublicKey) => Promise<Result<PublicKey[]>>;

  // Get topics for a forum
  // topics are the same as a post but with topic=true set
  getTopicsForForum: (collectionId: PublicKey) => Promise<Result<ForumPost[]>>;

  // Create a new topic
  createTopic: (
    post: {
      subj?: string;
      body: string;
      meta?: any;
    },
    collectionId: PublicKey,
    postRestriction?: PostRestriction,
  ) => Promise<Result<string>>;

  // For a given topic ID
  getTopicData?: (
    topicId: number,
    collectionId: PublicKey,
  ) => Promise<Result<ForumPost>>;

  // Create a post
  createForumPost: (
    post: {
      subj?: string;
      body: string;
      meta?: any;
    },
    topicId: number,
    collectionId: PublicKey,
  ) => Promise<Result<string>>;

  editForumPost: (
    collectionId: PublicKey,
    post: ForumPost,
    newPostData: {
      subj?: string;
      body: string;
      meta?: any;
    },
  ) => Promise<Result<string>>;

  // For a given topic, the messages
  getTopicMessages: (
    topicId: number,
    collectionId: PublicKey,
  ) => Promise<Result<ForumPost[]>>;

  deleteForumPost: (
    forumPost: ForumPost,
    collectionId: PublicKey,
    asMod?: boolean,
  ) => Promise<Result<string>>;

  // Vote a post up
  voteUpForumPost: (
    post: ForumPost,
    collectionId: PublicKey,
  ) => Promise<Result<string>>;

  // Vote a post down
  voteDownForumPost: (
    post: ForumPost,
    collectionId: PublicKey,
  ) => Promise<Result<string>>;

  // This is the same as createPost, but additionally,
  // post.parent = postId
  replyToForumPost: (
    replyToPost: ForumPost,
    collectionId: PublicKey,
    post: {
      subj?: string;
      body: string;
      meta?: any;
    },
  ) => Promise<Result<string>>;

  // For a given topic, the messages
  getReplies: (
    topic: ForumPost,
    collectionId: PublicKey,
  ) => Promise<Result<ForumPost[]>>;

  getForumPostRestriction: (
    collectionId: PublicKey,
  ) => Promise<Result<PostRestriction | null>>;

  setForumPostRestriction: (
    collectionId: PublicKey,
    restriction: PostRestriction,
  ) => Promise<Result<string>>;

  deleteForumPostRestriction: (
    collectionId: PublicKey,
  ) => Promise<Result<string>>;

  canCreateTopic: (collectionId: PublicKey) => Promise<boolean>;

  canPost: (collectionId: PublicKey, topic: ForumPost) => Promise<boolean>;

  canVote: (
    collectionId: PublicKey,
    post: ForumPost,
  ) => Promise<Result<boolean>>;

  getVote: (
    collectionId: PublicKey,
    post: ForumPost,
  ) => Promise<Result<boolean>>;

  getVotes: (collectionId: PublicKey) => Promise<Result<ChainVoteEntry[]>>;

  getNFTsForCurrentUser: () => Promise<Result<PublicKey[]>>;

  getNFTMetadataForCurrentUser: () => Promise<
  Promise<Result<DisplayableToken>>[] | DispatchError
  >;

  transferNFTs: (
    receiverId: PublicKey,
    mint: PublicKey,
    sendTransaction: (
      transaction: Transaction,
      connection: Connection,
    ) => Promise<string>,
  ) => Promise<Result<string>>;
}

export class DispatchForumV2 implements IForum {
  public user: User;

  public permission: Permission;

  constructor(wallet?: WalletInterface, conn: Connection, cluster: Cluster) {
    if (wallet.publicKey && conn) {
      this.permission = { readAndWrite: true };
      this.user = new User(wallet, conn, cluster);
    } else {
    //   // TODO(andrew) properly type this to an optional wallet to
    //   // account for possibly missing wallets, instead of having
    //   // this noop dummy wallet
    //   this.user = new User(wallet, conn, cluster);
    //   const wallet = {
    //     publicKey: new PublicKey('11111111111111111111111111111111'),
    //     signAllTransactions: async () => {
    //       return Promise.resolve([]);
    //     },
    //     signTransaction: async () => {
    //       return Promise.resolve(new Transaction());
    //     },
    //     sendTransaction: async () => {
    //       return Promise.resolve('');
    //     },
    //     wallet: null,
    //   };
    //   this.permission = { readAndWrite: false };
    // }
    }

    exists = async (collectionPublicKey: PublicKey): Promise<boolean> => {
      const forum = new Forum(
        this.user.dispatchConnection,
        collectionPublicKey,
      );

      return forum.exists();
    };

    createForum = async (forumInfo: ForumInfo): Promise<Result<{ forum: Forum; txs: string[] }>> => {
      try {
        const collectionPublicKey = new PublicKey(forumInfo.collectionId);
        const forumAsOwner = new Forum(
          this.user.dispatchConnection,
          collectionPublicKey,
        );

        this.user.wallet.signMessage('test');
        return { forum: forumAsOwner, txs: ['success'] };
      } catch (error) {
        return parseError(error);
      }
    };

    isOwner = async (collectionId: PublicKey): Promise<boolean> => {
      const forum = new Forum(
        this.user.dispatchConnection,
        collectionId,
      );
      const isOwner = await forum.isOwner();
      return isOwner;
    };

    isModerator = async (collectionId: PublicKey): Promise<boolean> => {
      const forum = new Forum(
        this.user.dispatchConnection,
        collectionId,
      );
      const isMod = await forum.isModerator();
      return isMod;
    };

    // Get the description of the forum: title and blurb
    getDescription = async (
      collectionId: PublicKey,
      // If this parameter is set, skip checking whether the forum
      // exists on-chain
      assumeExists = false,
    ): Promise<
    Result<{
      title: string;
      desc: string;
    }>
    > => {
      const owner = this.wallet;
      const conn = this.connection;

      try {
        if (owner.publicKey) {
          const forum = new Forum(
            this,
            collectionId,
          );

          if (assumeExists || (await forum.exists())) {
            const desc = await forum.getDescription();
            if (desc != null) {
              return desc;
            } else {
              return notFoundError('Description not found');
            }
          } else {
            return notFoundError('Forum does not exist');
          }
        } else {
          return notFoundError('Owner publicKey not found');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    setImageUrls = async (
      collectionId: PublicKey,
      image: string,
    ): Promise<Result<string>> => {
      const owner = this.wallet;
      const conn = this.connection;

      try {
        const forum = new Forum(
          this,
          collectionId,
        );

        const expectedImages = { background: image };
        const tx = await forum.setImageUrls(expectedImages);
        return tx;
      } catch (error) {
        return parseError(error);
      }
    };

    getImageUrls = async (collectionId: PublicKey): Promise<Result<any>> => {
      const owner = this.wallet;
      const conn = this.connection;

      try {
        const forum = new Forum(
          this,
          collectionId,
        );
        const tx = await forum.getImageUrls();
        return tx;
      } catch (error) {
        return parseError(error);
      }
    };

    getModeratorMint = async (
      collectionId: PublicKey,
      assumeExists = false,
    ): Promise<Result<PublicKey>> => {
      const owner = this.wallet;
      const conn = this.connection;

      try {
        if (owner.publicKey) {
          const forum = new Forum(
            this,
            collectionId,
          );

          if (assumeExists || (await forum.exists())) {
            const moderatorMint = forum.getModeratorMint();
            return await moderatorMint;
          } else {
            return notFoundError('Forum does not exist');
          }
        } else {
          return notFoundError('Owner public key not found');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    setDescription = async (
      collectionId: PublicKey,
      desc: {
        title: string;
        desc: string;
      },
    ): Promise<Result<string>> => {
      const owner = this.wallet;
      const conn = this.connection;

      try {
        const forum = new Forum(
          this,
          collectionId,
        );

        const tx = await forum.setDescription(desc);
        return tx;
      } catch (error) {
        return parseError(error);
      }
    };

    addModerator = async (
      newMod: PublicKey,
      collectionId: PublicKey,
    ): Promise<Result<string>> => {
      const owner = this.wallet;
      const conn = this.connection;

      try {
        const forumAsOwner = new Forum(
          this,
          collectionId,
        );

        if (await forumAsOwner.exists()) {
          const tx = await forumAsOwner.addModerator(newMod);
          return tx;
        } else {
          return notFoundError('Forum does not exist');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    setOwners = async (
      newOwners: PublicKey[],
      collectionId: PublicKey,
    ): Promise<Result<string>> => {
      const owner = this.wallet;
      const conn = this.connection;

      try {
        const forumAsOwner = new Forum(
          this,
          collectionId,
        );

        if (await forumAsOwner.exists()) {
          const tx = await forumAsOwner.setOwners(newOwners);
          return tx;
        } else {
          return notFoundError('Forum does not exist');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    getModerators = async (
      collectionId: PublicKey,
      // If this parameter is set, skip checking whether the forum
      // exists on-chain
      assumeExists = false,
    ): Promise<Result<PublicKey[]>> => {
      try {
        const forumAsOwner = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );

        if (assumeExists || (await forumAsOwner.exists())) {
          const tx = await forumAsOwner.getModerators();
          return tx;
        } else {
          return notFoundError('Forum does not exist');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    getOwners = async (
      collectionId: PublicKey,
      // If this parameter is set, skip checking whether the forum
      // exists on-chain
      assumeExists = false,
    ): Promise<Result<PublicKey[]>> => {
      try {
        const forumAsOwner = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );

        if (assumeExists || (await forumAsOwner.exists())) {
          const tx = await forumAsOwner.getOwners();
          return tx;
        } else {
          return notFoundError('Forum does not exist');
        }
      } catch (error) {
        return parseError(JSON.stringify(error));
      }
    };

    getForumForCollection = async (
      collectionId: PublicKey,
    ): Promise<Result<Forum>> => {
      const forum = new Forum(
        this.user.dispatchConnection,
        collectionId,
      );

      try {
        if (await forum.exists()) {
          return forum;
        } else {
          return notFoundError('Forum does not exist');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    getTopicsForForum = async (
      collectionId: PublicKey,
    ): Promise<Result<ForumPost[]>> => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        if (await forum.exists()) {
          const topics = await forum.getTopicsForForum();

          return topics;
        } else {
          return notFoundError('Forum does not exist');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    getPostsForForum = async (
      collectionId: PublicKey,
      // If this parameter is set, skip checking whether the forum
      // exists on-chain
      assumeExists = false,
    ): Promise<Result<ForumPost[]>> => {
      const { wallet, connection } = this;

      try {
        const forum = new Forum(
          new DispatchConnection(connection, wallet, { cluster: this.cluster }),
          collectionId,
        );
        if (assumeExists || (await forum.exists())) {
          const posts = await forum.getPostsForForum();

          return posts;
        } else {
          return notFoundError('Forum does not exist');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    canCreateTopic = async (collectionId: PublicKey): Promise<boolean> => {
      const forum = new Forum(
        this.user.dispatchConnection,
        collectionId,
      );
      if (await forum.canCreateTopic()) {
        return true;
      } else {
        return false;
      }
    };

    createTopic = async (
      topic: { subj?: string; body: string; meta?: any },
      collectionId: PublicKey,
      postRestriction?: PostRestriction,
    ): Promise<Result<string>> => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        if (await forum.exists()) {
          const newTopic = await forum.createTopic(topic, postRestriction);

          return newTopic;
        } else {
          return notFoundError('The forum does not exist');
        }
      } catch (err) {
        return parseError(err);
      }
    };

    getTopicData = async (
      topicId: number,
      collectionId: PublicKey,
    ): Promise<Result<ForumPost>> => {
      const owner = this.wallet;
      const conn = this.connection;

      try {
        const forum = new Forum(
          this,
          collectionId,
        );
        const topics = await forum.getTopicsForForum();

        const topic = topics.filter(t => t.isTopic && t.postId === topicId);
        return topic[0];
      } catch (err) {
        return parseError(err);
      }
    };

    canPost = async (
      collectionId: PublicKey,
      topic: ForumPost,
    ): Promise<boolean> => {
      const owner = this.wallet;
      const conn = this.connection;

      const forum = new Forum(
        this,
        collectionId,
      );
      if (await forum.canPost(topic)) {
        return true;
      } else {
        return false;
      }
    };

    createForumPost = async (
      post: {
        subj?: string;
        body: string;
        meta?: any;
      },
      topicId: number,
      collectionId: PublicKey,
    ): Promise<Result<string>> => {
      const owner = this.wallet;
      const conn = this.connection;
      try {
        const forum = new Forum(
          this,
          collectionId,
        );
        const topic = await this.getTopicData(topicId, collectionId);
        if ((await forum.exists()) && topic) {
          if (isSuccess(topic)) {
            return await forum.createForumPost(post, topic);
          } else {
          // If topic is an error, return that error
            const error = topic;
            return error;
          }
        } else {
          return notFoundError('Forum does not exist');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    editForumPost = async (
      collectionId: PublicKey,
      post: ForumPost,
      newPostData: {
        subj?: string;
        body: string;
        meta?: any;
      },
    ): Promise<Result<string>> => {
      const owner = this.wallet;
      const conn = this.connection;

      try {
        const forum = new Forum(
          this,
          collectionId,
        );
        const tx = await forum.editForumPost(post, newPostData);
        return tx;
      } catch (error) {
        return parseError(error);
      }
    };

    getTopicMessages = async (
      topicId: number,
      collectionId: PublicKey,
    ): Promise<Result<ForumPost[]>> => {
      const owner = this.wallet;
      const conn = this.connection;

      try {
        const forum = new Forum(
          this,
          collectionId,
        );
        const topic = await this.getTopicData(topicId, collectionId);
        if (isSuccess(topic)) {
          const topicPosts = await forum.getTopicMessages(topic);
          return topicPosts;
        } else {
        // If topic is an error, return the error
          const error = topic;
          return error;
        }
      } catch (error) {
        return parseError(error);
      }
    };

    deleteForumPost = async (
      post: ForumPost,
      collectionId: PublicKey,
      asMod?: boolean,
    ): Promise<Result<string>> => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        const tx = await forum.deleteForumPost(post, asMod);

        return tx;
      } catch (error) {
        return parseError(error);
      }
    };

    voteUpForumPost = async (
      post: ForumPost,
      collectionId: PublicKey,
    ): Promise<Result<string>> => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        const tx = await forum.voteUpForumPost(post);

        return tx;
      } catch (error) {
        return parseError(error);
      }
    };

    voteDownForumPost = async (
      post: ForumPost,
      collectionId: PublicKey,
    ): Promise<Result<string>> => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        const tx = await forum.voteDownForumPost(post);

        return tx;
      } catch (error) {
        return parseError(error);
      }
    };

    replyToForumPost = async (
      replyToPost: ForumPost,
      collectionId: PublicKey,
      post: {
        subj?: string;
        body: string;
        meta?: any;
      },
    ): Promise<Result<string>> => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        const reply = await forum.replyToForumPost(replyToPost, post);

        return reply;
      } catch (error) {
        return parseError(error);
      }
    };

    getReplies = async (
      topic: ForumPost,
      collectionId: PublicKey,
    ): Promise<Result<ForumPost[]>> => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        const replies = await forum.getReplies(topic);

        return replies;
      } catch (error) {
        return parseError(error);
      }
    };

    getForumPostRestriction = async (collectionId: PublicKey) => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        const restriction = await forum.getForumPostRestriction();

        return restriction;
      } catch (error) {
        return parseError(error);
      }
    };

    setForumPostRestriction = async (
      collectionId: PublicKey,
      restriction: PostRestriction,
    ) => {
      try {
        const dispatchConn = new DispatchConnection(conn, wallet, {
          cluster: this.cluster,
        });
        const forum = new Forum(dispatchConn, collectionId);

        const tx = await forum.setForumPostRestrictionIx(restriction);

        return await dispatchConn.sendTransaction(tx);
      } catch (error) {
        return parseError(error);
      }
    };

    deleteForumPostRestriction = async (collectionId: PublicKey) => {
      try {
        const dispatchConn = new DispatchConnection(conn, wallet, {
          cluster: this.cluster,
        });
        const forum = new Forum(dispatchConn, collectionId);

        const tx = await forum.deleteForumPostRestriction();

        return tx;
      } catch (error) {
        return parseError(error);
      }
    };

    canVote = async (collectionId: PublicKey, post: ForumPost) => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        const tx = await forum.canVote(post);

        return tx;
      } catch (error) {
        return parseError(error);
      }
    };

    getVote = async (collectionId: PublicKey, post: ForumPost) => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        const vote = await forum.getVote(post);
        if (vote == VoteType.down) {
          return false;
        } else if (vote == VoteType.up) {
          return true;
        } else {
        // Vote is undefined
          return notFoundError('The vote is neither up nor down');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    getVotes = async (collectionId: PublicKey) => {
      try {
        const forum = new Forum(
          this.user.dispatchConnection,
          collectionId,
        );
        const votes = await forum.getVotes();
        if (votes != null) {
          return votes;
        } else {
          return notFoundError('The votes were not found');
        }
      } catch (error) {
        return parseError(error);
      }
    };

    getNFTsForCurrentUser = async () => {
      try {
        const mintsForOwner = await getMintsForOwner(conn, wallet.publicKey!);
        return mintsForOwner;
      } catch (error) {
        return parseError(error);
      }
    };

    getNFTMetadataForCurrentUser = async (): Promise<
    Promise<Result<DisplayableToken>>[] | DispatchError
    > => {
      try {
        const metadataForOwner = await getMetadataForOwner(
          conn,
          wallet.publicKey!,
        );
        const displayableMetadataPromises: Promise<Result<DisplayableToken>>[] = metadataForOwner.map(async ({ mint, data }) => {
        // Remove NUL bytes from name and URI
          const name = data.name.replaceAll('\x00', '');
          const uri = data.uri.replaceAll('\x00', '');

          if (uri === '') {
            return notFoundError(
              `Cannot load metadata for token ${mint.toBase58()}. Field uri is empty`,
            );
          }

          const url = stringToURL(uri);
          if (isSuccess(url)) {
            if (url.protocol === 'https:') {
              let fetchedURI;
              let parsed;
              try {
                fetchedURI = await fetch(url);
                parsed = await fetchedURI.json();
              } catch (error) {
                return notFoundError(
                  `Cannot load metadata for token ${mint.toBase58()}. The metadata URI is invalid.`,
                );
              }

              // Verify that the parsed object has a string image
              if ('image' in parsed && typeof parsed.image === 'string') {
                const imageURL = stringToURL(parsed.image);
                if (isSuccess(imageURL)) {
                  if (imageURL.protocol === 'https:') {
                  // This is, at long last, the end of the
                  // success path. Return the expected object
                  // here. Every other path should produce an
                  // error.
                    return {
                      name,
                      mint,
                      uri: imageURL,
                    };
                  } else {
                  // TODO(andrew) categorize this error? Bad
                  // format error?
                    return badInputError(
                      `Cannot use non HTTP-protocol ${
                        parsed.image.protocol
                      } in ${url} for token ${mint.toBase58()}`,
                    );
                  }
                } else {
                  return badInputError(
                    `Image address ${
                      parsed.image
                    } is not a valid URL for mint ${mint.toBase58()}`,
                  );
                }
              } else {
                return badInputError(
                  `Cannot parse fetched image metadata ${parsed} for token ${mint.toBase58()}. .image field is not found or not a string.`,
                );
              }
            } else {
              return badInputError(
                `Cannot use non HTTP-protocol ${
                  url.protocol
                } in ${url} for token ${mint.toBase58()}`,
              );
            }
          } else {
          // If URL parsing failed, return the parsing error
            return url;
          }
        });

        // const results = await Promise.all(displayableMetadataPromises);

        // const successes = displayableMetadataPromises.filter(result => {
        //   if (isSuccess(result)) {
        //     // keep successes
        //     return true;
        //   } else {
        //     // Report failures
        //     console.error(result);
        //     return false;
        //   }
        // }) as DisplayableToken[];

        // Return successes
        return displayableMetadataPromises;
      } catch (error) {
        return parseError(error);
      }
    };

    transferNFTs = async (
      receiverId: PublicKey,
      mint: PublicKey,
      sendTransaction: (
        transaction: Transaction,
        connection: Connection,
      ) => Promise<string>,
    ) => {
      try {
        const receiverAcc = await getAssociatedTokenAddress(mint, receiverId);
        const txn = new Transaction();
        try {
          await getAccount(conn, receiverAcc);
        } catch (error: any) {
          txn.add(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey!, // payer
              receiverAcc, // ata
              receiverId, // owner
              mint, // mint
            ),
          );
        }
        const ownerAcc = await getAssociatedTokenAddress(mint, wallet.publicKey!);

        txn.add(
          createTransferCheckedInstruction(
            ownerAcc, // from (should be a token account)
            mint, // mint
            receiverAcc, // to (should be a token account)
            wallet.publicKey!, // from's owner
            // TODO[zfaizal2] : get amount and decimals from tokenAccount
            1, // amount, if your deciamls is 8, send 10^8 for 1 token
            0, // decimals
          ),
        );
        const result = sendTransaction(txn, conn);

        return await result;
      } catch (error) {
        console.log('dsp', error);
        return parseError(error);
      }
    };
  }
}

export const MainForum = DispatchForumV2;
