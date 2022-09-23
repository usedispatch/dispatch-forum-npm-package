import isNil from "lodash/isNil";
import { useState, ReactNode, useMemo } from "react";
import { PublicKey } from "@solana/web3.js";

import { Info } from "../../../assets";
import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Tooltip,
  TransactionLink,
} from "../../common";
import { Notification } from "..";

import { useForum } from "../../../contexts/DispatchProvider";
import { NOTIFICATION_BANNER_TIMEOUT } from "../../../utils/consts";
import { isSuccess } from "../../../utils/loading";
import { errorSummary } from "../../../utils/error";

interface UploadForumBannerProps {
  collectionId: PublicKey;
  onSetImageURL: (url: string) => void;
}

export function UploadForumBanner(props: UploadForumBannerProps) {
  const { collectionId, onSetImageURL } = props;
  const forumObject = useForum();
  const { permission } = forumObject;

  const [forumImage, setForumImage] = useState<{
    showUploadImage: boolean;
    imageURL: string;
    saving: boolean;
  }>({ showUploadImage: false, imageURL: "", saving: false });

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

  const reset = () =>
    setForumImage({ showUploadImage: false, imageURL: "", saving: false });

  const onSave = async () => {
    setForumImage({ ...forumImage, saving: true });

    const tx = await forumObject.setImageUrls(
      collectionId,
      forumImage.imageURL
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
        NOTIFICATION_BANNER_TIMEOUT
      );
      onSetImageURL(forumImage.imageURL);
      reset();
    } else {
      reset();
      setModalInfo({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The access token could not be added`,
        collapsible: { header: "Error", content: errorSummary(tx) },
      });
    }
  };

  const typeError = useMemo(() => {
    if (forumImage.imageURL.length > 0) {
      const type = forumImage.imageURL.substring(
        forumImage.imageURL.lastIndexOf(".") + 1
      );

      return type.toLowerCase() !== "png";
    }
  }, [forumImage.imageURL]);

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
            title={"Upload banner image"}
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
                    message="The image must beof type png"
                  />
                </div>
                <input
                  placeholder="add image URL"
                  className={`imageSrcInput ${typeError ? "invalid" : ""}`}
                  onBlur={(e) =>
                    setForumImage({ ...forumImage, imageURL: e.target.value })
                  }
                />
                {!typeError && forumImage.imageURL.length > 0 && (
                  <div className="imageContainer">
                    <img src={forumImage.imageURL} alt="" />
                  </div>
                )}
              </div>
            }
            onClose={() => reset()}
            okButton={
              <button className="okButton" onClick={() => onSave()}>
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
          Customize banner
        </button>
      </div>
    </div>
  );
}
