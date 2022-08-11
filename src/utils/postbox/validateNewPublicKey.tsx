import { PublicKey } from "@solana/web3.js";

const bs58 = require("bs58");

export const newPublicKey = (s: string) => {
  try {
    const d = bs58.decode(s);
    return new PublicKey(s);
  } catch (error) {
    throw { message: `The public key '${s}' is invalid` };
  }
};
