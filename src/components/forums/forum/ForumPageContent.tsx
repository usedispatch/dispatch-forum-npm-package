import { getCustomStyles } from '../../../utils/getCustomStyles';
import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { PublicKey } from '@solana/web3.js';

import { MessageType, Spinner } from '../../../components/common';
import {
  CreateForum,
  ForumContent,
  PoweredByDispatch,
} from '../../../components/forums';

import { useForum, useRole } from '../../../contexts/DispatchProvider';
import { getUserRole } from './../../../utils/postbox/userRole';
import { isSuccess, isInitial, isPending } from '../../../utils/loading';
import { isError, isNotFoundError } from '../../../utils/error';
import { useForumData, useModal } from '../../../utils/hooks';

interface ForumPageContentProps {
  forumID: string;
}

export function ForumPageContent(props: ForumPageContentProps): JSX.Element {
  const { forumID } = props;
  const forumObject = useForum();
  const Role = useRole();
  const { wallet, permission } = forumObject;
  const { publicKey } = wallet;

  const { modal, showModal } = useModal();

  const customStyle = getCustomStyles(forumID);

  const forumPublicKey = useMemo(() => {
    try {
      const pubkey = new PublicKey(forumID);
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
  }, [forumID]);
  const { forumData, update } = useForumData(forumPublicKey, forumObject);

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

  return (
    <div className={customStyle}>
      <Helmet>
        <meta charSet="utf-8" />
        {isError(forumData) && isNotFoundError(forumData) && (
          <title>Create Forum for {forumID}</title>
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
              } else if (isInitial(forumData) || isPending(forumData)) {
                return (
                  <div className="forumLoading">
                    <Spinner />
                  </div>
                );
              } else if (isNotFoundError(forumData)) {
                return (
                  <CreateForum
                    forumObject={forumObject}
                    collectionId={forumID}
                    update={update}
                  />
                );
              } else {
                // TODO(andrew) better, more detailed error
                // view here
                return disconnectedView;
              }
            })()}
          </div>
          <PoweredByDispatch customStyle={customStyle} />
        </div>
      </div>
    </div>
  );
}
