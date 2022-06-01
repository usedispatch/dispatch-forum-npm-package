import _ from "lodash";
import {
  DispatchConnection,
  Forum,
  ForumInfo,
  ForumPost,
  WalletInterface
} from "@usedispatch/client";
import * as web3 from "@solana/web3.js";

enum UserCategory {
  moderator,
  owner,
  poster,
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
  ): Promise<Forum | undefined>;

  // Get the description of the forum: title and blurb
  getDescription(collectionId: web3.PublicKey): Promise<{
    title: string;
    desc: string;
  } | undefined>;

  addModerator(newMod: web3.PublicKey, collectionId: web3.PublicKey): Promise<string | undefined>;

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
    collectionId: web3.PublicKey
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
  ): Promise<void>;

  // For a given topic, the messages
  getTopicMessages(topicId: number, collectionId: web3.PublicKey): Promise<ForumPost[] | undefined>;

  deleteForumPost(forumPost: ForumPost, collectionId: web3.PublicKey, asMod?: boolean): Promise<string>;

  // This is the same as createPost, but additionally,
  // post.parent = postId
  replyToForumPost(replyToPost: ForumPost, collectionId: web3.PublicKey, post: {
    subj?: string;
    body: string;
    meta?: any;
  }): Promise<string>;

  // For a given topic, the messages
  getReplies(topic: ForumPost, collectionId: web3.PublicKey): Promise<ForumPost[]>;
}

export class DispatchForum implements IForum {
  private wallet: WalletInterface;
  private connection: web3.Connection;

  constructor(wallet: WalletInterface, conn: web3.Connection) {
    this.connection = conn;
    this.wallet = wallet;
  }

  createForum = async (forumInfo: ForumInfo) => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      const collectionPublicKey = new web3.PublicKey(forumInfo.collectionId);
      if (owner.publicKey) {
        const forumAsOwner = new Forum(
          new DispatchConnection(conn, owner),
          collectionPublicKey
        );

        if (!(await forumAsOwner.exists())) {
          const txs = await forumAsOwner.createForum({
            collectionId: collectionPublicKey,
            owners: [owner.publicKey],
            moderators: forumInfo.moderators,
            title: forumInfo.title,
            description: forumInfo.description,
          });
          await Promise.all(txs.map((t) => conn.confirmTransaction(t)));
        }

        return forumAsOwner;
      }
    } catch (error) {
      throw "The forum could not be created";
    }
  };

  isOwner= async(collectionId: web3.PublicKey): Promise<boolean> =>{
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet), collectionId);
    const isOwner= await forum.isOwner();
    return isOwner
  }

  isModerator= async (collectionId: web3.PublicKey): Promise<boolean> => {
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet), collectionId);
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
          new DispatchConnection(conn, owner),
          collectionId
        );

        if ((await forum.exists())) {
          const desc = await forum.getDescription();
          return desc;
        }

      }
    } catch (error) {
      throw "The forum could not be created";
    }
  }

  addModerator = async (newMod: web3.PublicKey, collectionId: web3.PublicKey): Promise<string | undefined> => {
    const owner = this.wallet;
    const conn = this.connection;

    try {
      if (owner.publicKey) {
        const forumAsOwner = new Forum(
          new DispatchConnection(conn, owner),
          collectionId
        );

        if (!(await forumAsOwner.exists())) {
          const tx = await forumAsOwner.addModerator(newMod);
          return tx;
        }

      }
    } catch (error) {
      throw "The forum could not be created";
    }
  }

  getForumForCollection = async (
    collectionId: web3.PublicKey
  ): Promise<Forum | undefined> => {
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet), collectionId);

    if (await forum.exists()) {
      return forum;
    }
  };

  getTopicsForForum = async (
    collectionId: web3.PublicKey
  ): Promise<ForumPost[] | undefined> => {
    const wallet = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, wallet), collectionId);
    if (await forum.exists()) {
      const topics = await forum.getTopicsForForum();

      return topics;
    }
  };

  createTopic = async (
    topic: { subj?: string; body: string; meta?: any },
    collectionId: web3.PublicKey
  ): Promise<string | undefined> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(
        new DispatchConnection(conn, wallet),
        collectionId
      );
      if (await forum.exists()) {
        const newTopic = await forum.createTopic(topic);
        await conn.confirmTransaction(newTopic);

        return newTopic;
      }
    } catch (err) {
      console.log("create a new topic error:", err);
    }
  };

  getTopicData = async (
    topicId: number,
    collectionId: web3.PublicKey
  ): Promise<ForumPost> => {
    const owner = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, owner), collectionId);
    const topics = await forum.getTopicsForForum();

    const topic = topics.filter((t) => t.isTopic && t.postId === topicId);
    return topic[0];
  };

  createForumPost = async (
    post: {
      subj?: string;
      body: string;
      meta?: any;
    },
    topicId: number,
    collectionId: web3.PublicKey
  ): Promise<void> => {
    const owner = this.wallet;
    const conn = this.connection;

    const forum = new Forum(
      new DispatchConnection(conn, owner),
      collectionId
    );
    const topic = await this.getTopicData(topicId, collectionId);
    if ((await forum.exists()) && topic) {
      const tx1 = await forum.createForumPost(post, topic);
      await conn.confirmTransaction(tx1);
    }
  };

  getTopicMessages = async (topicId: number, collectionId: web3.PublicKey): Promise<ForumPost[] | undefined> => {
    const owner = this.wallet;
    const conn = this.connection;

    const forum = new Forum(new DispatchConnection(conn, owner),collectionId);
    const topic = await this.getTopicData(topicId, collectionId);
    const topicPosts = await forum.getTopicMessages(topic);

    return topicPosts;
  };

  deleteForumPost = async (post: ForumPost, collectionId: web3.PublicKey, asMod?: boolean): Promise<string> => {
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet), collectionId);
      const tx = await forum.deleteForumPost(post, asMod);

      return tx;
    } catch (error) {
      throw(error)
    }
  };

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
      const forum = new Forum(new DispatchConnection(conn, wallet), collectionId);
      const reply = await forum.replyToForumPost(replyToPost, post);

      return reply;
    } catch (error) {
      throw(error)
    }
    };

  getReplies= async (topic: ForumPost, collectionId: web3.PublicKey): Promise<ForumPost[]> =>{
    const wallet = this.wallet;
    const conn = this.connection;

    try {
      const forum = new Forum(new DispatchConnection(conn, wallet), collectionId);
      const replies = await forum.getReplies(topic);

      return replies;
    } catch (error) {
      throw(error)
    }
  }
}

//TODO(Ana): bring back the db, put it on a differnt file

export const MainForum = DispatchForum;
