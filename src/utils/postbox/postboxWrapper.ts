import _, { min } from "lodash";
import {
  DispatchConnection,
  Forum,
  ForumInfo,
  ForumPost,
  WalletInterface,
  PostRestriction,
  getMintsForOwner,
  getMetadataForOwner,
  getMetadataForMints
} from "@usedispatch/client";
import * as web3 from "@solana/web3.js";

import { 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount
} from "@solana/spl-token";

import { parseError } from "../parseErrors";

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
    collectionId: web3.PublicKey
  ): Promise<Forum | undefined>;

  isOwner(collectionId: web3.PublicKey): Promise<boolean>

  isModerator(collectionId: web3.PublicKey): Promise<boolean>

  // Create a postbox for a given collection ID
  createForum(
    forumInfo: ForumInfo
  ): Promise<{forum: Forum, txs: string[]} | undefined>;

  // Get the description of the forum: title and blurb
  getDescription(collectionId: web3.PublicKey): Promise<{
    title: string;
    desc: string;
  } | undefined>;

  addModerator(newMod: web3.PublicKey, collectionId: web3.PublicKey): Promise<string | undefined>;

  addOwner(newOwner: web3.PublicKey, collectionId: web3.PublicKey): Promise<string | undefined>;
  
  // Get a list of moderators
  getModerators(collectionId: web3.PublicKey): Promise<web3.PublicKey[] | undefined>;

  // Get a list of owners
  getOwners(collectionId: web3.PublicKey): Promise<web3.PublicKey[] | undefined>;
  
  // Get topics for a forum
  // topics are the same as a post but with topic=true set
  getTopicsForForum(
    collectionId: web3.PublicKey
  ): Promise<ForumPost[] | undefined>;

  // Create a new topic
  createTopic(
    post: {
      subj?: string;
      body: string;
      meta?: any;
    },
    collectionId: web3.PublicKey,
    postRestriction?: PostRestriction
  ): Promise<string | undefined>;

  // For a given topic ID
  getTopicData?(
    topicId: number,
    collectionId: web3.PublicKey
  ): Promise<ForumPost>;

  // Create a post
  createForumPost(
    post: {
      subj?: string;
      body: string;
      meta?: any;
    },
    topicId: number,
    collectionId: web3.PublicKey
  ): Promise<string | undefined>;

  // For a given topic, the messages
  getTopicMessages(topicId: number, collectionId: web3.PublicKey): Promise<ForumPost[] | undefined>;

  deleteForumPost(forumPost: ForumPost, collectionId: web3.PublicKey, asMod?: boolean): Promise<string>;

  // Vote a post up
  voteUpForumPost(post: ForumPost, collectionId: web3.PublicKey): Promise<string>;

  // Vote a post down
  voteDownForumPost(post: ForumPost, collectionId: web3.PublicKey): Promise<string>;

  // This is the same as createPost, but additionally,
  // post.parent = postId
  replyToForumPost(replyToPost: ForumPost, collectionId: web3.PublicKey, post: {
    subj?: string;
    body: string;
    meta?: any;
  }): Promise<string>;

  // For a given topic, the messages
  getReplies(topic: ForumPost, collectionId: web3.PublicKey): Promise<ForumPost[]>;

  getForumPostRestriction(collectionId: web3.PublicKey): Promise<PostRestriction | null>;

  setForumPostRestriction(collectionId: web3.PublicKey, restriction: PostRestriction): Promise<string>;

  canCreateTopic(collectionId: web3.PublicKey): Promise<boolean>;

  canPost(collectionId: web3.PublicKey,topic: ForumPost): Promise<boolean>;

  canVote(collectionId: web3.PublicKey, post: ForumPost): Promise<boolean>;

  getNFTsForCurrentUser(): Promise<web3.PublicKey[]>;

  getNFTMetadataForCurrentUser: () => Promise<{mint: string, name: string; uri: string}[]>;

  transferNFTs(receiverId: web3.PublicKey, mint: string, sendTransaction: (transaction: web3.Transaction, connection: web3.Connection)=> Promise<string>): Promise<string>;
}

export class DispatchForum implements IForum {
  public wallet: WalletInterface;
  private connection: web3.Connection;
  public isNotEmpty: boolean;
  public permission: Permission;
  public cluster: web3.Cluster;

  constructor(wallet: WalletInterface, conn: web3.Connection, cluster: web3.Cluster) {
    this.connection = conn;
    this.wallet = wallet;
    this.isNotEmpty = true;
    this.cluster = cluster;

    if (wallet.publicKey && conn) {
      this.permission = { readAndWrite: true };
    } else {
      this.wallet = {
        publicKey: new web3.PublicKey('11111111111111111111111111111111'),
        signAllTransactions: () => {return Promise.resolve([])},
        signTransaction: () => {return Promise.resolve(new web3.Transaction())}
      };
      this.permission = { readAndWrite: false };
    }
  }

  createForum = async (forumInfo: ForumInfo) => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const collectionPublicKey = new web3.PublicKey(forumInfo.collectionId);
      if (owner.publicKey) {
        const forumAsOwner = new Forum(
          new DispatchConnection(conn, owner, {cluster: this.cluster}),
          collectionPublicKey
        );

        let txs = [] as string[];
        if (!(await forumAsOwner.exists())) {
          txs = await forumAsOwner.createForum({
            collectionId: collectionPublicKey,
            owners: [owner.publicKey],
            moderators: forumInfo.moderators,
            title: forumInfo.title,
            description: forumInfo.description,
          });
          await Promise.all(txs.map((t) => conn.confirmTransaction(t)));
        }

        return {forum: forumAsOwner, txs};
      }
    } catch (error) {
        throw(parseError(error))
    }
  };

  isOwner= async(collectionId: web3.PublicKey): Promise<boolean> =>{
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
    const isOwner= await forum.isOwner();
    return isOwner
  }

  isModerator= async (collectionId: web3.PublicKey): Promise<boolean> => {
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
    const isMod= await forum.isModerator();
    return isMod  
  }

  // Get the description of the forum: title and blurb
  getDescription = async (collectionId: web3.PublicKey): Promise<{
    title: string;
    desc: string;
  } | undefined> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      if (owner.publicKey) {
        const forum = new Forum(
          new DispatchConnection(conn, owner, {cluster: this.cluster}),
          collectionId
        );

        if ((await forum.exists())) {
          const desc = await forum.getDescription();
          return desc;
        }

      }
    } catch (error) {      
      throw(parseError(error))
    }
  }

  addModerator = async (newMod: web3.PublicKey, collectionId: web3.PublicKey): Promise<string | undefined> => {
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
      }
    } catch (error) {
      throw(parseError(error))
    }
  }

  addOwner = async (newOwner: web3.PublicKey, collectionId: web3.PublicKey): Promise<string | undefined> => {
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
      }
    } catch (error) {
      throw(error)
    }
  }

  getModerators = async (collectionId: web3.PublicKey): Promise<web3.PublicKey[] | undefined> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forumAsOwner = new Forum(
        new DispatchConnection(conn, wallet, {cluster: this.cluster}),
        collectionId
      );

      if (await forumAsOwner.exists()) {
        const tx = await forumAsOwner.getModerators();
        return tx;
      }
    } catch (error) {
      throw(parseError(error))
    }
  }

  getOwners = async (collectionId: web3.PublicKey): Promise<web3.PublicKey[] | undefined> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forumAsOwner = new Forum(
        new DispatchConnection(conn, wallet, {cluster: this.cluster}),
        collectionId
      );

      if (await forumAsOwner.exists()) {
        const tx = await forumAsOwner.getOwners();
        return tx;
      }
    } catch (error) {
      throw(JSON.stringify(error))
    }
  }

  getForumForCollection = async (
    collectionId: web3.PublicKey
  ): Promise<Forum | undefined> => {
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);

    try {
      if (await forum.exists()) {
        return forum;
      }
    } catch (error) {
      throw(parseError(error))
    }
  };

  getTopicsForForum = async (
    collectionId: web3.PublicKey
  ): Promise<ForumPost[] | undefined> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      if (await forum.exists()) {
        const topics = await forum.getTopicsForForum();

        return topics;
      }
    } catch (error) {
      throw(parseError(error))
    }
  };

  canCreateTopic = async(
    collectionId: web3.PublicKey
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
    collectionId: web3.PublicKey,
    postRestriction?: PostRestriction
  ): Promise<string | undefined> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(
        new DispatchConnection(conn, wallet, {cluster: this.cluster}),
        collectionId
      );
      if (await forum.exists()) {
        const newTopic = await forum.createTopic(topic, postRestriction);
        await conn.confirmTransaction(newTopic);

        return newTopic;
      }
    } catch (err) {
      throw(parseError(err))
    }
  };

  getTopicData = async (
    topicId: number,
    collectionId: web3.PublicKey
  ): Promise<ForumPost> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, owner, {cluster: this.cluster}), collectionId);
      const topics = await forum.getTopicsForForum();

      const topic = topics.filter((t) => t.isTopic && t.postId === topicId);
      return topic[0];
    } catch (err) {
      throw(parseError(err))
    }
  };

  canPost = async (
    collectionId: web3.PublicKey,
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
    collectionId: web3.PublicKey
  ): Promise<string | undefined> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(
        new DispatchConnection(conn, owner, {cluster: this.cluster}),
        collectionId
      );
      const topic = await this.getTopicData(topicId, collectionId);
      if ((await forum.exists()) && topic) {
        const tx1 = await forum.createForumPost(post, topic);
        await conn.confirmTransaction(tx1);

        return tx1
      } 
    } catch (error) {   
      throw(parseError(error))
    }
  };

  getTopicMessages = async (topicId: number, collectionId: web3.PublicKey): Promise<ForumPost[] | undefined> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, owner, {cluster: this.cluster}),collectionId);
      const topic = await this.getTopicData(topicId, collectionId);
      const topicPosts = await forum.getTopicMessages(topic);

      return topicPosts;
    } catch (error) {      
      throw(parseError(error))
    }
  };

  deleteForumPost = async (post: ForumPost, collectionId: web3.PublicKey, asMod?: boolean): Promise<string> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const tx = await forum.deleteForumPost(post, asMod);

      return tx;
    } catch (error) {      
      throw(parseError(error))
    }
  };

  voteUpForumPost = async (post: ForumPost, collectionId: web3.PublicKey): Promise<string> =>{
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const tx = await forum.voteUpForumPost(post);

      return tx;
    } catch (error) {      
      throw(parseError(error))
    }
  }

  voteDownForumPost = async (post: ForumPost, collectionId: web3.PublicKey): Promise<string> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const tx = await forum.voteDownForumPost(post);

      return tx;
    } catch (error) {          
      throw(parseError(error))
    }
  }
  
  replyToForumPost = async (
    replyToPost: ForumPost, collectionId: web3.PublicKey, 
    post: {
      subj?: string;
      body: string;
      meta?: any;
    }): Promise<string> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const reply = await forum.replyToForumPost(replyToPost, post);

      return reply;
    } catch (error) {      
      throw(parseError(error))
    }
  };

  getReplies = async (topic: ForumPost, collectionId: web3.PublicKey): Promise<ForumPost[]> =>{
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const replies = await forum.getReplies(topic);

      return replies;
    } catch (error) {      
      throw(parseError(error))
    }
  }

  getForumPostRestriction = async(collectionId: web3.PublicKey) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const restriction = await forum.getForumPostRestriction();

      return restriction;
    } catch (error) {          
      throw(parseError(error))
    }
  };

  setForumPostRestriction = async(collectionId: web3.PublicKey, restriction: PostRestriction) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const tx = await forum.setForumPostRestriction(restriction);

      return tx;
    } catch (error) {          
      throw(parseError(error))
    }
  };

  canVote = async(collectionId: web3.PublicKey, post: ForumPost) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet, {cluster: this.cluster}), collectionId);
      const tx = await forum.canVote(post);

      return tx;
    } catch (error) {          
      throw(parseError(error))
    }
  };
  
  getNFTsForCurrentUser = async() => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const mintsForOwner = await getMintsForOwner(conn, wallet.publicKey!);
      return mintsForOwner;
    } catch (error) {
        throw(parseError(error))
    }
  }

  getNFTMetadataForCurrentUser = async () => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const metadataForOwner = await getMetadataForOwner(conn, wallet.publicKey!);
      const result = metadataForOwner.map(md => ({mint: md.mint.toBase58(), name: md.data.name.replaceAll('\u0000', ''), uri: md.data.uri}));

      await Promise.all(result.map(async (r)=> {
        const fetchedURI = await fetch(r.uri);
        const parsed = await fetchedURI.json()
        r.uri = parsed?.image as string 
      }))

      return result
    } catch (error) {
        throw(parseError(error))
    }
  }

  transferNFTs = async(receiverId: web3.PublicKey, mint: string, sendTransaction: (transaction: web3.Transaction, connection: web3.Connection)=> Promise<string>) => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const mintPubKey = new web3.PublicKey(mint);
      let receiverAcc = await getAssociatedTokenAddress(mintPubKey, receiverId);
      let txn = new web3.Transaction();
      try {
        await getAccount(conn, receiverAcc);
      } catch (error: any) {

        txn.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey!, // payer
            receiverAcc, // ata
            receiverId, // owner
            mintPubKey // mint
          )
        );

      }
      const ownerAcc = await getAssociatedTokenAddress(mintPubKey, wallet.publicKey!);

      txn.add(
        createTransferCheckedInstruction(
          ownerAcc, // from (should be a token account)
          mintPubKey, // mint
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
        throw(parseError(error))
    }
  }
}

export const MainForum = DispatchForum;