import * as _ from "lodash";

const postboxErrorCode = {
  // Create post errors
  100: "The provided post ID is too large an increase",
  101: "The reply-to account is not a Post account",
  102: "Replies cannot have a further reply restriction",
  103: "Invalid setting type for post",

  // Post restriction errors
  200: "The provided token account is not a token account",
  201: "Missing the token required by the restriction",
  202: "Account provided is not expected metadata key",
  203: "The provided account is not a metadata account",
  204: "No collection set on the metadata",
  205: "Missing an NFT from the collection required by the restriction",
  206: "Cannot parse a setting",
  207: "Extra account offsets invalid for this restriction type",
  208: "Must supply offsets when a post restriction applies",
  209: "We hit the test error",
};

const hexToDecimal = (hex: string) => parseInt(hex, 16);

export function parseError(error: any) {
  let result = { ...error, message: JSON.stringify(error) };
  if (error.message != undefined) {
    const hexIndex = (error.message as string).indexOf("0x");
    if (hexIndex >= 0) {
      const hexString = (error.message as string).substring(hexIndex + 2);
      const decimal = hexToDecimal(hexString) - 6000;
      const message = postboxErrorCode[decimal];
      if (!_.isNil(result)) {
        result = { code: decimal, message };
      }
    } else {
      const json = error.toString().match(/(?:.*  )(.*)/);
      const errJson = JSON.parse(json[1]);
      if (errJson.error.code === 429)  {
        result = { code: 429, message: JSON.stringify("The Solana Blockchain RPC servers has rate limited your IP address, some actions may be limited, please try again in a few seconds." )};
      }
    }
  }
  return result;
}
 