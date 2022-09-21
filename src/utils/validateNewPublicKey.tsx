import { PublicKey } from "@solana/web3.js";
import { Result } from '../../types/error';
import { badInputError } from '../../utils/error';

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
