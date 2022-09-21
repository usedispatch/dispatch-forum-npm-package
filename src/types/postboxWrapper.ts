import { PublicKey } from '@solana/web3.js';

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

/**
 * The 'description' of a forum contains both a title and a
 * description
 */
export interface Description {
  title: string;
  desc: string;
}

