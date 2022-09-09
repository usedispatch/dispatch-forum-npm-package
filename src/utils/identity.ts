import { PublicKey } from '@solana/web3.js';

/**
 * A simple struct that associates a pubkey with a profile photo
 * and display name
 */
export interface Identity {
  publicKey: PublicKey;
  displayName: string;
  profilePicture: URL;
}

export const identities: Identity[] = [
  {
    publicKey: new PublicKey('6rF7ZEs84kAEA3bxcHeFJ2ej4vQxyhc5NrRpTvwkreTp'),
    displayName: 'Verata',
    profilePicture: new URL('https://drive.google.com/file/d/1z6FHPx9WvhdmnxCPGjNJ0EJVvsvvo-q3/view?usp=sharing')
  }
];

export function getIdentity(
  publicKey: PublicKey
): Identity | null {
  return identities.find(id =>
    id.publicKey.equals(publicKey)
  ) || null;
}
