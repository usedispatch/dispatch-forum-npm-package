import { PublicKey } from '@solana/web3.js'
import { useState } from 'react';

import { DispatchForum } from '../postbox/postboxWrapper';
import { Loading } from '../../types/loading';
import { Result } from '../../types/error';
import { notFoundError } from '../../utils/error';
import { initial } from '../../utils/loading';
import { parseError } from '../../utils/parseErrors';

export function useModerators(
  collectionId: PublicKey | null,
  forum: DispatchForum
): {
  moderators: Loading<PublicKey[]>,
    update: () => Promise<void>
} {
  const [moderators, setModerators] = useState<Loading<PublicKey[]>>(initial());

  async function fetchModerators(): Promise<Result<PublicKey[]>> {
    if (collectionId) {
      try {
        const fetchData = await forum.getModerators(collectionId, true);
        if (fetchData) {
          return fetchData;
        } else {
          return notFoundError('The moderators were not defined');
        }
      } catch (error) {
        return parseError(error);
      }
    } else {
      return notFoundError('The collectionId was not defined');
    }
  }

  async function update() {
    if (collectionId) {
      if (await forum.exists(collectionId)) {
        const fetchResult = await fetchModerators();
        setModerators(fetchResult);
      }
    }
  }

  return { moderators, update };
}
