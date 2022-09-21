import { PublicKey } from "@solana/web3.js";
import { Result } from '@types';
import { badInputError } from '@utils';

/**
 * Like new PublicKey(), but returns an error instead of throwing
 * one if the given value is not a valid pubkey
 */
export function newPublicKey(s: string): Result<PublicKey> {
  try {
    return new PublicKey(s);
  } catch (error) {
    return badInputError(
      `The public key '${s}' is invalid`
    );
  }
};
