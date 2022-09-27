import isNil from 'lodash/isNil';
import { useState, ReactNode, useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';

import { Info, Edit } from '../../../assets';
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Tooltip,
  TransactionLink,
} from '../../common';
import { Notification } from '..';

import { useForum } from '../../../contexts/DispatchProvider';
import { NOTIFICATION_BANNER_TIMEOUT } from '../../../utils/consts';
import { isSuccess } from '../../../utils/loading';
import { errorSummary } from '../../../utils/error';

interface UploadForumBannerProps {
  collectionId: PublicKey;
  currentBannerURL: string;
  onSetImageURL: (url: string) => void;
}

export function UploadForumBanner(props: UploadForumBannerProps): JSX.Element {
  const { collectionId, onSetImageURL, currentBannerURL } = props;
  const forumObject = useForum();
  const { permission } = forumObject;

  const [forumImage, setForumImage] = useState<{
    showUploadImage: boolean;
    imageURL: string;
    saving: boolean;
  }>({
    showUploadImage: false,
    imageURL: currentBannerURL,
    saving: false,
  });

  const [notificationContent, setNotificationContent] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const reset = (): void =>
    setForumImage({
      showUploadImage: false,
      imageURL: currentBannerURL,
      saving: false,
    });

  const typeError = useMemo(() => {
    if (forumImage.imageURL.length > 0) {
      const type = forumImage.imageURL.substring(
        forumImage.imageURL.lastIndexOf('.') + 1,
      );

      return type.toLowerCase() !== 'png';
    }

    return false;
  }, [forumImage.imageURL]);

  const onSave = async (): Promise<void> => {
    setForumImage({ ...forumImage, saving: true });

    const tx = await forumObject.setImageUrls(
      collectionId,
      forumImage.imageURL,
    );

    if (isSuccess(tx)) {
      setNotificationContent({
        isHidden: false,
        type: MessageType.success,
        content: (
          <>
            The banner was edited.
            <TransactionLink transaction={tx} />
          </>
        ),
      });
      setTimeout(
        () => setNotificationContent({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT,
      );
      onSetImageURL(forumImage.imageURL);
      reset();
    } else {
      reset();
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The banner image could not be updated',
        collapsible: { header: 'Error', content: errorSummary(tx) },
      });
    }
  };

  return (
    <div className="dsp- ">
      <div className="customizeBanner">
        <Notification
          hidden={notificationContent.isHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setNotificationContent({ isHidden: true })}
        />
        {!isNil(modalInfo) && (
          <PopUpModal
            id="create-topic-info"
            visible
            title={modalInfo.title}
            messageType={modalInfo.type}
            body={modalInfo.body}
            collapsible={modalInfo.collapsible}
            okButton={
              <a className="okButton" onClick={() => setModalInfo(null)}>
                OK
              </a>
            }
          />
        )}
        {forumImage.showUploadImage && (
          <PopUpModal
            id="cutomize-banner"
            visible
            title={'Upload banner image'}
            loading={forumImage.saving}
            body={
              <div className="uploadImageWrapper">
                <div className="uploadImageLabel">
                  Image URL
                  <Tooltip
                    content={
                      <div className="labelTooltip">
                        <Info />
                      </div>
                    }
                    message="The image must be of type png"
                  />
                </div>
                <input
                  placeholder="add URL for new banner"
                  className={'imageSrcInput'}
                  value={forumImage.imageURL}
                  onChange={e =>
                    setForumImage({ ...forumImage, imageURL: e.target.value })
                  }
                />
                {forumImage.imageURL.length > 0 && (
                  <div className="imageContainer">
                    {!typeError && <img src={forumImage.imageURL} alt="" />}
                    {typeError && <div>the image must be of png type </div>}
                  </div>
                )}
              </div>
            }
            onClose={() => reset()}
            okButton={
              <button
                className="okButton"
                disabled={typeError}
                onClick={async () => onSave()}>
                Save
              </button>
            }
          />
        )}
        <button
          className="customizeBannerButton"
          disabled={!permission.readAndWrite}
          onClick={() =>
            setForumImage({ ...forumImage, showUploadImage: true })
          }>
          <Edit />
        </button>
      </div>
    </div>
  );
}
