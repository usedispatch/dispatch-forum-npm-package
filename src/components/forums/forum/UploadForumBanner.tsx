import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";

import { Info } from "../../../assets";
import { MessageType, PopUpModal, Tooltip } from "../../common";
import { Notification } from "..";

import { useForum } from "../../../contexts/DispatchProvider";

interface UploadForumBannerProps {
  onSetImageURL: (url: string) => void;
}

export function UploadForumBanner(props: UploadForumBannerProps) {
  const { onSetImageURL } = props;
  const forumObject = useForum();
  const { permission } = forumObject;

  const [notificationContent, setNotificationContent] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });

  const fileTypes = "png";

  const [forumImage, setForumImage] = useState<{
    showUploadImage: boolean;
    imageURL: string;
    saving: boolean;
  }>({ showUploadImage: false, imageURL: "", saving: false });

  const reset = () =>
    setForumImage({ showUploadImage: false, imageURL: "", saving: false });

  const onSave = () => {
    setForumImage({ ...forumImage, saving: true });
    try {
      console.log(forumImage.imageURL);
      // await forumObject.setImageUrls(
      //   forumData.collectionId,
      //   bannerImage.href
      // );
      onSetImageURL(forumImage.imageURL);
      setForumImage({ ...forumImage, saving: false });
    } catch (error) {
      console.log(error);
      setForumImage({ ...forumImage, saving: false });
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
                    message="The image must be a png"
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
              <button
                className="okButton"
                disabled={forumImage.imageURL.length === 0}
                onClick={() => onSave()}>
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
