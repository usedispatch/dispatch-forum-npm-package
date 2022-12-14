import isNil from 'lodash/isNil';
import { useState, ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';

import { Info } from '../../../assets';
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
  onSetImageURL: (url: string) => Promise<void>;
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
      await onSetImageURL(forumImage.imageURL);
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
            onClose={() => setModalInfo(null)}
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
                  Banner URL
                  <Tooltip
                    content={
                      <div className="labelTooltip">
                        <Info />
                      </div>
                    }
                    message="Banners should be 1400px x 900px"
                  />
                </div>
                <input
                  placeholder="Add URL for new banner"
                  className={'imageSrcInput'}
                  value={forumImage.imageURL}
                  onChange={e =>
                    setForumImage({ ...forumImage, imageURL: e.target.value })
                  }
                />
                {forumImage.imageURL.length > 0 && (
                  <div className="imageContainer">
                    <img src={forumImage.imageURL} alt="" />
                  </div>
                )}
              </div>
            }
            onClose={() => reset()}
            okButton={
              <button
                className="okButton"
                disabled={forumImage.imageURL.length === 0 || forumImage.saving}
                onClick={onSave}
              >
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
          }
        >
          Edit banner
        </button>
      </div>
    </div>
  );
}
