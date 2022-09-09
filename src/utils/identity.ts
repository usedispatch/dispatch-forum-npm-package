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
  // DegenApes
  {
    publicKey: new PublicKey('BFvLq3gN8aRMLHygobRoGnmTwSooyeByZx63RPViMxhj'),
    displayName: 'Sea_Eoh',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/Sea_Eoh.jpeg')
  },
  // TODO Monoliff
  {
    publicKey: new PublicKey('E7MwrNbFtDaymDxa5ah69z1EyynFkWKrWnrGNSuL8BUo'),
    displayName: 'Crasskitty',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/Crasskitty.png')
  },
  {
    publicKey: new PublicKey('EfWzmSQW3VB8BVmNFBA1M2GcsQcZCWvSD27WArGs753p'),
    displayName: 'DevLock',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/DevLock.png')
  },
  {
    publicKey: new PublicKey('6rF7ZEs84kAEA3bxcHeFJ2ej4vQxyhc5NrRpTvwkreTp'),
    displayName: 'Verata',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/verata.png')
  },
  {
    publicKey: new PublicKey('G36xZhaHPtKNaGC3oWKtRHMCBWomkDT4BoaBxkLRGYjN'),
    displayName: 'NickyScanz',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/NickyScanz.png')
  },
  {
    publicKey: new PublicKey('6bqNbw4Zzweny7vC8gG6P66MV7gJcyaZ9bZoJmrne331'),
    displayName: 'King Konga',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/King_Konga.png')
  },
  {
    publicKey: new PublicKey('DMa4C88ZFqjjGs7nmwwAhVxwXnCpsEnqN6GdZJ3vHApu'),
    displayName: 'Jp_Up',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/Jp_up.png')
  },
  {
    publicKey: new PublicKey('8G73CkB9y4djR9pqKpDnzuPWveoK8x9daijyfjs2cDLg'),
    displayName: 'Toasi',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/Toasi.png')
  },
  {
    publicKey: new PublicKey('BvRcaZYyZCR4i4jgtR2oSSiM2xQ5muv1gPAma7U25pYJ'),
    displayName: 'DegenService',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/DegenService.png')
  },
  {
    publicKey: new PublicKey('63HPANsJRKeDPxGFcHShFQsv36TLWPduMS7JN3Y9HxPs'),
    displayName: 'Grove St',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/Grove_St.png')
  },
  {
    publicKey: new PublicKey('69RXtQajCYTmHEK6WPRszURg6ovQ59bVSdNAM8QvGX4e'),
    displayName: 'Sonder',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/Sonder.png')
  },
  {
    publicKey: new PublicKey('CH1xiMgDpFGngfEBMFjp5xD7vH54GVJYG6Lxspz5T4C4'),
    displayName: 'Conor Holds',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/Conor_Holds.png')
  },
  {
    publicKey: new PublicKey('9PtkVgmsYnmRGQb6R92rVgcRzTrRe1ttJchmB7dhgJNP'),
    displayName: 'Satyam',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/Satyam.png')
  },
  {
    publicKey: new PublicKey('AfJnSBXcwwEGzAxdwY4x1XGYWH2D7XuTduz89VNS6iLY'),
    displayName: 'Seb Monty',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/degenapes/Seb_Monty.png')
  },
  // dispatch team
  {
    publicKey: new PublicKey('85iDLGzsPBsXn7ao83WtRFsQLfqi8LYhYk3xu2uwo9qD'),
    displayName: 'andrew | dispatch',
    profilePicture: new URL('https://raw.githubusercontent.com/usedispatch/assets/main/img/dispatch/dispatch-logo-mark-color-circle-reverse-margin.png')
  }
];

export function getIdentity(
  publicKey: PublicKey
): Identity | null {
  return identities.find(id =>
    id.publicKey.equals(publicKey)
  ) || null;
}
