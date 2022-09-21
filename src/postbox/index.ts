import {
  DispatchConnection,
  Forum,
  ForumInfo,
  ForumPost,
  WalletInterface,
  PostRestriction,
  getMintsForOwner,
  getMetadataForOwner,
  VoteType,
  ChainVoteEntry,
} from "@usedispatch/client";
import {
  PublicKey,
  Transaction,
  Connection,
  Cluster
} from '@solana/web3.js';

import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount
} from "@solana/spl-token";

import {
  parseError,
  notFoundError,
  badInputError,
  isSuccess,
  stringToURL
} from '@utils'
import { Result } from '../types/error';
import {
  DisplayableToken,
  Description
} from '../types/postboxWrapper';

enum UserCategory {
  moderator,
  owner,
  poster,
}

interface Permission {
  readAndWrite: boolean;
}

export interface IForum {
  // For a given collection ID, only one postbox can exist
  getForumForCollection(
    collectionId: PublicKey
  ): Promise<Result<Forum>>;

  isOwner(collectionId: PublicKey): Promise<boolean>

  isModerator(collectionId: PublicKey): Promise<boolean>

  // Return whether the given forum exists or not
  exists(collectionPublicKey: PublicKey): Promise<boolean>;

  // Create a postbox for a given collection ID
  createForum(
    forumInfo: ForumInfo
  ): Promise<
    Result<{forum: Forum, txs: string[]}>
  >;

  // Get the description of the forum: title and blurb
  getDescription(
    collectionId: PublicKey
  ): Promise<Result<Description>>;
  
  getModeratorMint(collectionId: PublicKey, assumeExists?: boolean): Promise<Result<PublicKey>>;

  setDescription(collectionId: PublicKey, desc: {
    title: string;
    desc: string;
  }): Promise<Result<string>>;

  addModerator(newMod: PublicKey, collectionId: PublicKey): Promise<Result<string>>;

  addOwner(newOwner: PublicKey, collectionId: PublicKey): Promise<Result<string>>;

  // Get a list of moderators
  getModerators(collectionId: PublicKey): Promise<Result<PublicKey[]>>;

  // Get a list of owners
  getOwners(collectionId: PublicKey): Promise<Result<PublicKey[]>>;

  // Get topics for a forum
  // topics are the same as a post but with topic=true set
  getTopicsForForum(
    collectionId: PublicKey
  ): Promise<Result<ForumPost[]>>;

  // Create a new topic
  createTopic(
    post: {
      subj?: string;
      body: string;
      meta?: any;
    },
    collectionId: PublicKey,
    postRestriction?: PostRestriction
  ): Promise<Result<string>>;

  // For a given topic ID
  getTopicData?(
    topicId: number,
    collectionId: PublicKey
  ): Promise<Result<ForumPost>>;

  // Create a post
  createForumPost(
    post: {
      subj?: string;
      body: string;
      meta?: any;
    },
    topicId: number,
    collectionId: PublicKey
  ): Promise<Result<string>>;

  editForumPost(collectionId: PublicKey, post: ForumPost, newPostData: {
    subj?: string;
    body: string;
    meta?: any;
  }): Promise<Result<string>>;

  // For a given topic, the messages
  getTopicMessages(topicId: number, collectionId: PublicKey): Promise<Result<ForumPost[]>>;

  deleteForumPost(forumPost: ForumPost, collectionId: PublicKey, asMod?: boolean): Promise<Result<string>>;

  // Vote a post up
  voteUpForumPost(post: ForumPost, collectionId: PublicKey): Promise<Result<string>>;

  // Vote a post down
  voteDownForumPost(post: ForumPost, collectionId: PublicKey): Promise<Result<string>>;

  // This is the same as createPost, but additionally,
  // post.parent = postId
  replyToForumPost(replyToPost: ForumPost, collectionId: PublicKey, post: {
    subj?: string;
    body: string;
    meta?: any;
  }): Promise<Result<string>>;

  // For a given topic, the messages
  getReplies(topic: ForumPost, collectionId: PublicKey): Promise<Result<ForumPost[]>>;

  getForumPostRestriction(collectionId: PublicKey): Promise<Result<PostRestriction | null>>;

  setForumPostRestriction(collectionId: PublicKey, restriction: PostRestriction): Promise<Result<string>>;

  deleteForumPostRestriction(collectionId: PublicKey): Promise<Result<string>>;

  canCreateTopic(collectionId: PublicKey): Promise<boolean>;

  canPost(collectionId: PublicKey,topic: ForumPost): Promise<boolean>;

  canVote(collectionId: PublicKey, post: ForumPost): Promise<Result<boolean>>;

  getVote(collectionId: PublicKey, post: ForumPost): Promise<Result<boolean>>;

  getVotes(collectionId: PublicKey): Promise<Result<ChainVoteEntry[]>>;

  getNFTsForCurrentUser(): Promise<Result<PublicKey[]>>;

  getNFTMetadataForCurrentUser: () => Promise<Result<DisplayableToken[]>>;

  transferNFTs(receiverId: PublicKey, mint: PublicKey, sendTransaction: (transaction: Transaction, connection: Connection)=> Promise<string>): Promise<Result<string>>;
}

export class DispatchForum implements IForum {
  public wallet: WalletInterface;
  public connection: Connection;
  public permission: Permission;
  public cluster: Cluster;

  constructor(wallet: WalletInterface, conn: Connection, cluster: Cluster) {
    this.connection = conn;
    this.wallet = wallet;
    this.cluster = cluster;

    if (wallet.publicKey && conn) {
      this.permission = { readAndWrite: true };
    } else {
      // TODO(andrew) properly type this to an optional wallet to
      // account for possibly missing wallets, instead of having
      // this noop dummy wallet
      this.wallet = {
        publicKey: new PublicKey('11111111111111111111111111111111'),
        signAllTransactions: () => {return Promise.resolve([])},
        signTransaction: () => {return Promise.resolve(new Transaction())},
        sendTransaction: () => {return Promise.resolve('');},
        wallet: null
      };
      this.permission = { readAndWrite: false };
    }
  }

  exists = async (collectionPublicKey: PublicKey) => {
    const { connection, wallet, cluster } = this;
    const forum = new Forum(
      new DispatchConnection(connection, wallet, { cluster }),
      collectionPublicKey
    );

    return forum.exists();
  }

  createForum = async (forumInfo: ForumInfo) => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const collectionPublicKey = new PublicKey(forumInfo.collectionId);
      if (owner.publicKey) {
        const forumAsOwner = new Forum(
          new DispatchConnection(conn, owner, {cluster: this.cluster}),
          collectionPublicKey
        );

        let txs = [] as string[];
        if (!(await forumAsOwner.exists())) {
          const forumInfoObject = {
            collectionId: collectionPublicKey,
            owners: forumInfo.owners,
            moderators: forumInfo.moderators,
            title: forumInfo.title,
            description: forumInfo.description,
            postRestriction: forumInfo.postRestriction
          }

          if (forumInfo.postRestriction?.nftOwnership !== undefined || forumInfo.postRestriction?.tokenOwnership !== null) {
            forumInfoObject.postRestriction = forumInfo.postRestriction;
          }

          txs = await forumAsOwner.createForum(forumInfoObject);
        }

        return {forum: forumAsOwner, txs};
      } else {
        return notFoundError('Owner public key not found');
      }
    } catch (error) {
        return parseError(error);
    }
  };

  isOwner= async(collectionId: PublicKey): Promise<boolean> =>{
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
    const isOwner= await forum.isOwner();
    return isOwner
  }

  isModerator= async (collectionId: PublicKey): Promise<boolean> => {
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
    const isMod= await forum.isModerator();
    return isMod
  }

  // Get the description of the forum: title and blurb
  getDescription = async (
    collectionId: PublicKey,
    // If this parameter is set, skip checking whether the forum
    // exists on-chain
    assumeExists = false
  ): Promise<Result<{
    title: string;
    desc: string;
  }>> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      if (owner.publicKey) {
        const forum = new Forum(
          new DispatchConnection(conn, owner, {cluster: this.cluster}),
          collectionId
        );

        if (assumeExists || await forum.exists()) {
          const desc = await forum.getDescription();
          if (desc) {
            return desc;
          } else {
            return notFoundError('Description not found');
          }
        } else {
          return notFoundError(
            'Forum does not exist'
          );
        }

      } else {
        return notFoundError(
          'Owner publicKey not found'
        );
      }
    } catch (error) {
      return parseError(error);
    }
  }

  getModeratorMint = async (
    collectionId: PublicKey,
    assumeExists = false
  ): Promise<Result<PublicKey>> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      if (owner.publicKey) {
        const forum = new Forum(
          new DispatchConnection(conn, owner, { cluster: this.cluster }),
          collectionId
        );

        if(assumeExists || await forum.exists()) {
          const moderatorMint = forum.getModeratorMint();
          return moderatorMint;
        } else {
          return notFoundError(
            'Forum does not exist'
          );
        }
      } else {
        return notFoundError(
          'Owner public key not found'
        );
      }
    } catch (error) {
      return parseError(error);;
    }
  }


  setDescription = async (collectionId: PublicKey, desc: {
    title: string;
    desc: string;
  }): Promise<Result<string>> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(
        new DispatchConnection(conn, owner, {cluster: this.cluster}),
        collectionId
      );

      const tx = await forum.setDescription(desc);
      return tx;
    } catch (error) {
      return parseError(error);
    }
  }

  addModerator = async (newMod: PublicKey, collectionId: PublicKey): Promise<Result<string>> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const forumAsOwner = new Forum(
        new DispatchConnection(conn, owner, {cluster: this.cluster}),
        collectionId
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
  }

  addOwner = async (newOwner: PublicKey, collectionId: PublicKey): Promise<Result<string>> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const forumAsOwner = new Forum(
        new DispatchConnection(conn, owner, {cluster: this.cluster}),
        collectionId
      );

      if (await forumAsOwner.exists()) {
        const tx = await forumAsOwner.addOwners([newOwner]);
        return tx;
      } else {
        return notFoundError('Forum does not exist');
      }
    } catch (error) {
      return parseError(error);
    }
  }

  getModerators = async (
    collectionId: PublicKey,
    // If this parameter is set, skip checking whether the forum
    // exists on-chain
    assumeExists = false
  ): Promise<Result<PublicKey[]>> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forumAsOwner = new Forum(
        new DispatchConnection(conn, wallet, {cluster: this.cluster}),
        collectionId
      );

      if (assumeExists || await forumAsOwner.exists()) {
        const tx = await forumAsOwner.getModerators();
        return tx;
      } else {
        return notFoundError('Forum does not exist');
      }
    } catch (error) {
      return parseError(error);
    }
  }

  getOwners = async (
    collectionId: PublicKey,
    // If this parameter is set, skip checking whether the forum
    // exists on-chain
    assumeExists = false
  ): Promise<Result<PublicKey[]>> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forumAsOwner = new Forum(
        new DispatchConnection(conn, wallet, {cluster: this.cluster}),
        collectionId
      );

      if (assumeExists || await forumAsOwner.exists()) {
        const tx = await forumAsOwner.getOwners();
        return tx;
      } else {
        return notFoundError('Forum does not exist');
      }
    } catch (error) {
      return parseError(JSON.stringify(error))
    }
  }

  getForumForCollection = async (
    collectionId: PublicKey
  ): Promise<Result<Forum>> => {
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);

    try {
      if (await forum.exists()) {
        return forum;
      } else {
        return notFoundError(
          'Forum does not exist'
        );
      }
    } catch (error) {
      return parseError(error);
    }
  };

  getTopicsForForum = async (
    collectionId: PublicKey
  ): Promise<Result<ForumPost[]>> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
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
    assumeExists = false
  ): Promise<Result<ForumPost[]>> => {
    const { wallet, connection } = this;

    try {
      const forum = new Forum(new DispatchConnection(connection, wallet, {cluster: this.cluster}), collectionId);
      if (assumeExists || await forum.exists()) {
        const posts = await forum.getPostsForForum();

        return posts;
      } else {
        return notFoundError(
          'Forum does not exist'
        );
      }
    } catch (error) {
      return parseError(error);
    }
  }

  canCreateTopic = async(
    collectionId: PublicKey
  ): Promise<boolean> => {
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
    if (await forum.canCreateTopic()) {
      return true;
    } else {
      return false;
    }
  };

  createTopic = async (
    topic: { subj?: string; body: string; meta?: any },
    collectionId: PublicKey,
    postRestriction?: PostRestriction
  ): Promise<Result<string>> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(
        new DispatchConnection(conn, wallet, {cluster: this.cluster}),
        collectionId
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
    collectionId: PublicKey
  ): Promise<Result<ForumPost>> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, owner, {cluster: this.cluster}), collectionId);
      const topics = await forum.getTopicsForForum();

      const topic = topics.filter((t) => t.isTopic && t.postId === topicId);
      return topic[0];
    } catch (err) {
      return parseError(err)
    }
  };

  canPost = async (
    collectionId: PublicKey,
    topic: ForumPost
  ): Promise<boolean> => {
    const owner = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, owner, {cluster: this.cluster}), collectionId);
    if (await forum.canPost(topic)) {
      return true;
    } else {
      return false;
    }
  }

  createForumPost = async (
    post: {
      subj?: string;
      body: string;
      meta?: any;
    },
    topicId: number,
    collectionId: PublicKey
  ): Promise<Result<string>> => {
    const owner = this.wallet;
    const conn = this.connection;
    try {
      const forum = new Forum(
        new DispatchConnection(conn, owner, {cluster: this.cluster}),
        collectionId
      );
      const topic = await this.getTopicData(topicId, collectionId);
      if ((await forum.exists()) && topic) {

        if (isSuccess(topic)) {
          return forum.createForumPost(post, topic);
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


  editForumPost = async(collectionId: PublicKey, post: ForumPost, newPostData: {
    subj?: string;
    body: string;
    meta?: any;
  }): Promise<Result<string>> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(
        new DispatchConnection(conn, owner, {cluster: this.cluster}),
        collectionId
      );
      const tx = await forum.editForumPost(post, newPostData);
      return tx
    } catch (error) {
      return parseError(error);
    }}

  getTopicMessages = async (topicId: number, collectionId: PublicKey): Promise<Result<ForumPost[]>> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, owner, {cluster: this.cluster}),collectionId);
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

  deleteForumPost = async (post: ForumPost, collectionId: PublicKey, asMod?: boolean): Promise<Result<string>> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const tx = await forum.deleteForumPost(post, asMod);

      return tx;
    } catch (error) {
      return parseError(error);
    }
  };

  voteUpForumPost = async (post: ForumPost, collectionId: PublicKey): Promise<Result<string>> =>{
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const tx = await forum.voteUpForumPost(post);

      return tx;
    } catch (error) {
      return parseError(error);
    }
  }

  voteDownForumPost = async (post: ForumPost, collectionId: PublicKey): Promise<Result<string>> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const tx = await forum.voteDownForumPost(post);

      return tx;
    } catch (error) {
      return parseError(error);
    }
  }

  replyToForumPost = async (
    replyToPost: ForumPost, collectionId: PublicKey,
    post: {
      subj?: string;
      body: string;
      meta?: any;
    }): Promise<Result<string>> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const reply = await forum.replyToForumPost(replyToPost, post);

      return reply;
    } catch (error) {
      return parseError(error);
    }
  };

  getReplies = async (topic: ForumPost, collectionId: PublicKey): Promise<Result<ForumPost[]>> =>{
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const replies = await forum.getReplies(topic);

      return replies;
    } catch (error) {
      return parseError(error);
    }
  }

  getForumPostRestriction = async(collectionId: PublicKey) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const restriction = await forum.getForumPostRestriction();

      return restriction;
    } catch (error) {
      return parseError(error);
    }
  };

  setForumPostRestriction = async(collectionId: PublicKey, restriction: PostRestriction) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const dispatchConn = new DispatchConnection(conn, wallet, {cluster: this.cluster});
      const forum = new Forum(dispatchConn, collectionId);

      const tx = await forum.setForumPostRestrictionIx(restriction);

      return dispatchConn.sendTransaction(tx);
    } catch (error) {
      return parseError(error);
    }
  };


  deleteForumPostRestriction = async(collectionId: PublicKey) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const dispatchConn = new DispatchConnection(conn, wallet, {cluster: this.cluster});
      const forum = new Forum(dispatchConn, collectionId);

      const tx = await forum.deleteForumPostRestriction();

      return tx;
    } catch (error) {
      return parseError(error);
    }
  };

  canVote = async(collectionId: PublicKey, post: ForumPost) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const tx = await forum.canVote(post);

      return tx;
    } catch (error) {
      return parseError(error);
    }
  };

  getVote = async(collectionId: PublicKey, post: ForumPost) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const vote = await forum.getVote(post);
      if (vote == VoteType.down) {
        return false;
      } else if (vote == VoteType.up) {
        return true;
      } else {
        // Vote is undefined
        return notFoundError(
          'The vote is neither up nor down'
        );
      }
    } catch (error) {
      return parseError(error);
    }

  }

  getVotes = async(collectionId: PublicKey) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const votes = await forum.getVotes();
      if (votes) {
        return votes;
      } else {
        return notFoundError('The votes were not found');
      }
    } catch (error) {
      return parseError(error);
    }
  }

  getNFTsForCurrentUser = async() => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const mintsForOwner = await getMintsForOwner(conn, wallet.publicKey!);
      return mintsForOwner;
    } catch (error) {
        return parseError(error);
    }
  }

  getNFTMetadataForCurrentUser = async () => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const metadataForOwner = await getMetadataForOwner(conn, wallet.publicKey!);
      const displayableMetadataPromises: Promise<Result<DisplayableToken>>[] = metadataForOwner.map(async ({ mint, data }) => {
        // Remove NUL bytes from name and URI
        const name = data.name.replaceAll('\x00', '');
        const uri = data.uri.replaceAll('\x00', '');

        if (uri === '') {
          return notFoundError(
            `Cannot load metadata for token ${mint.toBase58()}. Field uri is empty`
          );
        }

        const url = stringToURL(uri);
        if (isSuccess(url)) {
          if (url.protocol === 'https:') {

            let fetchedURI;
            let parsed;
            try {
              fetchedURI = await fetch(url);
              parsed = await fetchedURI.json()
            }
            catch (error) {
              return notFoundError(
                `Cannot load metadata for token ${mint.toBase58()}. The metadata URI is invalid.`
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
                    uri: imageURL
                  };
                } else {
                  // TODO(andrew) categorize this error? Bad
                  // format error?
                  return badInputError(
                    `Cannot use non HTTP-protocol ${parsed.image.protocol} in ${url} for token ${mint.toBase58()}`
                  );
                }
              } else {
                return badInputError(
                  `Image address ${parsed.image} is not a valid URL for mint ${mint.toBase58()}`
                );
              }
            } else {
              return badInputError(
                `Cannot parse fetched image metadata ${parsed} for token ${mint.toBase58()}. .image field is not found or not a string.`
              );
            }
          } else {
            return badInputError(
              `Cannot use non HTTP-protocol ${url.protocol} in ${url} for token ${mint.toBase58()}`
            );
          }
        } else {
          // If URL parsing failed, return the parsing error
          return url;
        }
      });

      const results = await Promise.all(displayableMetadataPromises)

      const successes = results.filter(result => {
        if (isSuccess(result)) {
          // keep successes
          return true;
        } else {
          // Report failures
          console.error(result);
          return false;
        }
      }) as DisplayableToken[];

      // Return successes
      return successes;
    } catch (error) {
        return parseError(error);
    }
  }

  transferNFTs = async(receiverId: PublicKey, mint: PublicKey, sendTransaction: (transaction: Transaction, connection: Connection)=> Promise<string>) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      let receiverAcc = await getAssociatedTokenAddress(mint, receiverId);
      let txn = new Transaction();
      try {
        await getAccount(conn, receiverAcc);
      } catch (error: any) {

        txn.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey!, // payer
            receiverAcc, // ata
            receiverId, // owner
            mint // mint
          )
        );

      }
      const ownerAcc = await getAssociatedTokenAddress(mint, wallet.publicKey!);

      txn.add(
        createTransferCheckedInstruction(
          ownerAcc, // from (should be a token account)
          mint, // mint
          receiverAcc, // to (should be a token account)
          wallet.publicKey!, // from's owner
          //TODO[zfaizal2] : get amount and decimals from tokenAccount
          1, // amount, if your deciamls is 8, send 10^8 for 1 token
          0 // decimals
        )
      );
      const result = sendTransaction(txn, conn);

      return result;
    } catch (error) {
      console.log(error)
        return parseError(error);
    }
  }
}

export const MainForum = DispatchForum;
