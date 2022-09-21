import { PublicKey } from '@solana/web3.js';
import { Result } from './error';
import { Description } from './postboxWrapper';
import { Loading } from './loading';
import { ForumPost, PostRestriction, ChainVoteEntry } from "@usedispatch/client";

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
 * Any kind of post that can be held in the client state. This
 * can be a full-fledged ForumPost, a CreatedPost that has not
 * been confirmed yet, or an EditedPost that already exists
 * on-chain  but has been edited.
 */
export type ClientPost
  = ForumPost
  | CreatedPost
  | EditedPost;

/**
 * A post that has been edited locally, but the edit nas not yet
 * ben confirmed on-chain. Should not be able to be interacted
 * with. Unlike a CreatedPost, this type has an `address`, which
 * is the existing address of the post being edited
 */
export type EditedPost
  = ForumPost
  & { state: 'edited' };

