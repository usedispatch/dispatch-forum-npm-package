import isNil from 'lodash/isNil';
import { DispatchError } from '../types/error';
import { uncategorizedError } from '../utils/error';

const postboxErrorCode = {
  // Create post errors
  // 0x0 corresponds to account already in use, in this case most
  // likely means that the post ID is already in use
  0: 'This forum is experiencing high on-chain activity. Please try again shortly.',
  6100: 'The provided post ID is too large an increase',
  6101: 'The reply-to account is not a Post account',
  6102: 'Replies cannot have a further reply restriction',
  6103: 'Invalid setting type for post',

  // Post restriction errors
  6200: 'The provided token account is not a token account',
  6201: 'Missing the token required by the restriction',
  6202: 'Account provided is not expected metadata key',
  6203: 'The provided account is not a metadata account',
  6204: 'No collection set on the metadata',
  6205: 'Missing an NFT from the collection required by the restriction',
  6206: 'Cannot parse a setting',
  6207: 'Extra account offsets invalid for this restriction type',
  6208: 'Must supply user credentials when post restrictions apply',
  6209: 'We hit the test error',
  6210: 'You have already made this vote, you can only vote up or down once, but you can switch your vote',
};

const hexToDecimal = (hex: string): number => parseInt(hex, 16);

export function parseError(error: any): DispatchError {
  if (!isNil(error?.message)) {
    const hexIndex = (error.message as string).indexOf('0x');
    if (hexIndex >= 0 && !isNil(error.message)) {
      const hexString = (error.message as string).substring(hexIndex + 2);
      const decimal = hexToDecimal(hexString);
      const message = postboxErrorCode[decimal];
      return {
        errorKind: 'Contract',
        code: decimal,
        message,
      };
    } else {
      // Check for Wallet issue
      const str = error.toString() as string;
      if (str.includes('WalletSendTransactionError')) {
        return {
          errorKind: 'Wallet',
          message: `${str}`,
          suggestion:
            'Make sure you are using the correct network, devnet or mainnet, and try again',
        };
      } else if (str.includes('mint could not be unpacked')) {
        return {
          errorKind: 'BadInput',
          message: JSON.stringify('Invalid Mint Address'),
          suggestion:
            'The mint address you entered is invalid, please check the address or try another.',
        };
      }
      // TODO(andrew) these two lines produce a "cannot find
      // property 1 of null" error when the string doesn't match
      // the given regex. Should make error-handling more study
      // overall
      const json = str.match(/(?:.* {2})(.*)/) ?? [];
      const errJson = JSON.parse(json[1]);
      if (errJson.error.code === 429) {
        return {
          errorKind: 'RateLimiting',
          message: JSON.stringify('HTTP 429 Rate limited'),
          suggestion:
            'The Solana Blockchain RPC servers has rate limited your IP address, some actions may be limited, please try again in a few seconds.',
        };
      } else {
        return uncategorizedError(error);
      }
    }
  } else {
    return uncategorizedError(error);
  }
}
