import { useState, useEffect, useMemo } from 'react';
import ReactGA from 'react-ga4';
import { Helmet } from 'react-helmet';
import { PublicKey } from '@solana/web3.js';

import { MessageType, Spinner, TransactionLink } from '../../components/common';
import {
  CreateForum,
  ForumContent,
  PoweredByDispatch,
} from '../../components/forums';

import { useForum, useRole } from './../../contexts/DispatchProvider';
import { getUserRole } from './../../utils/postbox/userRole';
import { isSuccess, isInitial, isPending } from '../../utils/loading';
import { errorSummary, isError, isNotFoundError } from '../../utils/error';
import { useForumData, useModal } from '../../utils/hooks';
import { getCustomStyles } from '../../utils/getCustomStyles';
import { isNil } from 'lodash';
import { ForumInfo } from '@usedispatch/client';

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

  const [creationData, setCreationData] = useState<{ title: string; desc: string }>();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    update(); // Update every time the cluster is changed
  }, [forumObject.cluster]);

  useEffect(() => {
    if (!isNil(collectionPublicKey) && isSuccess(forumData) && permission.readAndWrite) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      getUserRole(forumObject, collectionPublicKey, Role);
    }
  }, [forumData, publicKey]);

  const disconnectedView = (
    <div className="disconnectedView">
      Connect to your wallet in order to see or create a forum
    </div>
  );

  const onCreateForum = async (info: ForumInfo): Promise<void> => {
    setCreating(true);
    setCreationData({ title: info.title, desc: info.description });
    const res = await forumObject.createForum(info);

    if (isSuccess(res)) {
      if (!isNil(res.forum)) {
        showModal({
          title: 'Success!',
          body: (
            <div className="successBody">
              <div>{`The forum '${info.title}' for the collection ${croppedCollectionID} was created`}</div>
              <div>
                {res.txs.map(tx => (
                  <TransactionLink transaction={tx} key={tx} />
                ))}
              </div>
            </div>
          ),
          type: MessageType.success,
        });

        if (!isNil(res.txs)) {
          await Promise.all(
            res.txs.map(async tx =>
              forumObject.connection.confirmTransaction(tx),
            ),
          ).then(async () => {
            await update();
            setCreating(false);
          });
        }
      }
      ReactGA.event('successfulForumCreation');
    } else {
      setCreating(false);
      const error = res;
      ReactGA.event('failedForumCreation');
      showModal({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: `The forum '${info.title}' for the collection ${croppedCollectionID} could not be created.`,
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
    }
  };

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
                      update={update}
                    />
                  );
                } else if (creating) {
                  return (
                    <ForumContent
                      forumObject={forumObject}
                      basicInfo={creationData}
                      update={update}
                    />
                  );
                } else if (isPending(forumData) || isInitial(forumData)) {
                  return (
                    <div className="forumLoading">
                      <Spinner />
                    </div>
                  );
                } else if (isNotFoundError(forumData) && !creating) {
                  return (
                    <CreateForum
                      forumObject={forumObject}
                      collectionId={collectionId}
                      update={update}
                      sendCreateForum={async (info) => onCreateForum(info) }
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
