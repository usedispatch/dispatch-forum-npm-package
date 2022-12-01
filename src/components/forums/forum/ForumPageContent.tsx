import {
  CreateForum,
  ForumContent,
  PoweredByDispatch,
} from '../../../components/forums';
import { MessageType, Spinner, TransactionLink } from '../../../components/common';
import { errorSummary, isError, isNotFoundError } from '../../../utils/error';
import { isInitial, isPending, isSuccess } from '../../../utils/loading';
import { useEffect, useMemo, useState } from 'react';
import { useForum, useRole, useTheme } from '../../../contexts/DispatchProvider';
import { useForumData, useModal } from '../../../utils/hooks';

import { ForumInfo } from '@usedispatch/client';
import { Helmet } from 'react-helmet';
import { PublicKey } from '@solana/web3.js';
import ReactGA from 'react-ga4';
import { getCustomStyles } from '../../../utils/getCustomStyles';
import { getUserRole } from './../../../utils/postbox/userRole';

interface ForumPageContentProps {
  forumID: string;
  showTitle?: boolean;
}

export function ForumPageContent(props: ForumPageContentProps): JSX.Element {
  const { forumID, showTitle } = props;
  const forumObject = useForum();
  const Role = useRole();
  const { wallet, permission } = forumObject;
  const { publicKey } = wallet;
  const theme = useTheme();
  const { modal, showModal } = useModal();

  const customStyle = getCustomStyles(forumID);
  const [creationData, setCreationData] = useState<{ title: string; desc: string }>();
  const [creating, setCreating] = useState(false);

  const forumPublicKey = useMemo(() => {
    try {
      const pubkey = new PublicKey(forumID);
      return pubkey;
    } catch (error) {
      const message = JSON.stringify(error);
      console.log('dsp', error);
      showModal({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'Invalid Collection ID Public Key',
        collapsible: { header: 'Error', content: message },
      });
      return null;
    }
  }, [forumID]);
  const { forumData, update } = useForumData(forumPublicKey, forumObject);

  const followForum = async (): Promise<void> => {
    const res = await forumObject.followForum(new PublicKey(forumID));
    console.log(res);
  };

  const onCreateForum = async (info: ForumInfo): Promise<void> => {
    setCreating(true);
    setCreationData({ title: info.title, desc: info.description });
    const res = await forumObject.createForum(info);

    if (isSuccess(res)) {
      if (res.forum !== undefined) {
        showModal({
          title: 'Success!',
          body: (
            <div className="successBody">
              <div>{`The forum '${info.title}' for the collection ${forumID} was created`}</div>
              <div>
                {res.txs.map(tx => (
                  <TransactionLink transaction={tx} key={tx} />
                ))}
              </div>
            </div>
          ),
          type: MessageType.success,
        });

        if (res.txs !== undefined) {
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
      setCreationData(undefined);
      setCreating(false);
      const error = res;
      ReactGA.event('failedForumCreation');
      showModal({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: `The forum '${info.title}' for the collection ${forumID} could not be created.`,
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
    }
  };

  useEffect(() => {
    void update();
    // Update every time the cluster is changed
  }, [forumObject.cluster]);

  useEffect(() => {
    if (
      isSuccess(forumData) &&
      permission.readAndWrite &&
      forumPublicKey !== null
    ) {
      void getUserRole(forumObject, forumPublicKey, Role);
    }
  }, [forumData, publicKey]);

  const disconnectedView = (
    <div className="disconnectedView">
      Connect to your wallet in order to see or create a forum
    </div>
  );

  const content = useMemo(() => {
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
          collectionId={forumID}
          update={update}
          sendCreateForum={async (info) => onCreateForum(info) }
        />
      );
    } else {
      // TODO(andrew) better, more detailed error
      // view here
      return disconnectedView;
    }
  }, [forumData, creating, publicKey]);

  return (
  <div className={theme.mode}>
    <div className={customStyle}>
      {showTitle === true && <Helmet>
        <meta charSet="utf-8" />
        {isError(forumData) && isNotFoundError(forumData) && (
          <title>Create Forum for {forumID}</title>
        )}
        {isSuccess(forumData) && (
          <title>{forumData.description.title} -- Forum</title>
        )}
      </Helmet>}
      <div className="forumView">
        {modal}
        <div className="forumViewContainer">
          <button onClick={async () => followForum()}>
            Follow
          </button>
          <div className="forumViewContent">
            {content}
            <PoweredByDispatch customStyle={customStyle} />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
