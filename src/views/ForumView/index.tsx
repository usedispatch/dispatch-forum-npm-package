import { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { PublicKey } from '@solana/web3.js';

import { MessageType } from '../../components/common';
import {
  CreateForum,
  ForumContent,
  PoweredByDispatch,
} from '../../components/forums';

import { useForum, useRole } from './../../contexts/DispatchProvider';
import { getUserRole } from './../../utils/postbox/userRole';
import { isSuccess, isInitial, isPending } from '../../utils/loading';
import { isError, isNotFoundError } from '../../utils/error';
import { useForumData, useModal } from '../../utils/hooks';
import { getCustomStyles } from '../../utils/getCustomStyles';
import { isNil } from 'lodash';

interface ForumViewProps {
  collectionId: string;
}

export const ForumView = (props: ForumViewProps): JSX.Element => {
  const forumObject = useForum();
  const Role = useRole();
  const { wallet, permission } = forumObject;
  const { publicKey } = wallet;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [croppedCollectionID, setCroppedCollectionId] = useState<string>('');

  const { modal, showModal } = useModal();

  const collectionId = props.collectionId;
  const collectionPublicKey = useMemo(() => {
    try {
      const pubkey = new PublicKey(collectionId);

      // TODO(andrew) make croppedCollectionID a useMemo() call as well?
      // see https://www.notion.so/usedispatch/Only-Show-Forums-with-valid-Public-Keys-eaf833a2d69a4bc69f760509b4bfee6d
      setCroppedCollectionId(
        `${collectionId.slice(0, 4)}...${collectionId.slice(-4)}`,
      );

      return pubkey;
    } catch (error) {
      const message = JSON.stringify(error);
      console.log(error);
      showModal({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'Invalid Collection ID Public Key',
        collapsible: { header: 'Error', content: message },
      });
      return null;
    }
  }, [collectionId]);

  const customStyle = getCustomStyles(collectionId);

  const { forumData, update } = useForumData(collectionPublicKey, forumObject);

  useEffect(() => {
    void update();
    // Update every time the cluster is changed
  }, [forumObject.cluster]);

  const updateUserRole = useCallback(async () => {
    if (!isNil(collectionPublicKey) && isSuccess(forumData) && permission.readAndWrite) {
      await getUserRole(forumObject, collectionPublicKey, Role);
    }
  }, [forumData, publicKey]);

  useEffect(() => {
    updateUserRole().catch(console.error);
  }, [updateUserRole]);

  const disconnectedView = (
    <div className="disconnectedView">
      Connect to your wallet in order to see or create a forum
    </div>
  );

  return (
    <div className="dsp-">
      <div className={customStyle}>
        <Helmet>
          <meta charSet="utf-8" />
          {isError(forumData) && isNotFoundError(forumData) && (
            <title>Create Forum for {collectionId}</title>
          )}
          {isSuccess(forumData) && (
            <title>{forumData.description.title} -- Forum</title>
          )}
        </Helmet>
        <div className="forumView">
          {modal}
          <div className="forumViewContainer">
            <div className="forumViewContent">
              {(() => {
                if (isSuccess(forumData)) {
                  return (
                    <ForumContent
                      forumObject={forumObject}
                      forumData={forumData}
                      basicInfo={{ title: forumData.description.title, desc: forumData.description.desc, gated: false }}
                      update={update}
                    />
                  );
                } else if (isInitial(forumData) || isPending(forumData)) {
                  return (
                    <ForumContent
                      forumObject={forumObject}
                      basicInfo={{ title: 'test', desc: 'desc', gated: false }}
                      update={update}
                    />
                  );
                } else if (isNotFoundError(forumData)) {
                  return (
                    <CreateForum
                      forumObject={forumObject}
                      collectionId={collectionId}
                      update={update}
                    />
                  );
                } else {
                  // TODO(andrew) better, more detailed error view here
                  return disconnectedView;
                }
              })()}
            </div>
            <PoweredByDispatch customStyle={customStyle} />
          </div>
        </div>
      </div>
    </div>
  );
};
