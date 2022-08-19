import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";
import ImageUploading from "react-images-uploading";

import { MessageType } from "../../common";
import { Notification } from "../index";

interface UploadForumImageProps {
  imageURL: (url: string) => void;
}

export function UploadForumImage(props: UploadForumImageProps) {
  const { imageURL } = props;

  const [notificationContent, setNotificationContent] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });

  const fileTypes = ["png"];

  const [images, setImages] = useState<any[]>([]);

  const onChange = (imageList) => {
    imageURL(imageList[0].data_url);
    setImages(imageList);
  };

  return (
    <div className="dsp- ">
      <div className="">
        <Notification
          hidden={notificationContent.isHidden}
          content={notificationContent?.content}
          type={notificationContent?.type}
          onClose={() => setNotificationContent({ isHidden: true })}
        />
        <ImageUploading
          value={images}
          onChange={onChange}
          maxNumber={1}
          acceptType={fileTypes}
          dataURLKey="data_url">
          {({
            imageList,
            onImageUpload,
            onImageUpdate,
            onImageRemove,
            isDragging,
            dragProps,
          }) => (
            <div className="uploadImageWrapper">
              {imageList.length === 0 && (
                <button
                  style={isDragging ? { color: "red" } : undefined}
                  className="dragAndDropButton"
                  onClick={onImageUpload}
                  {...dragProps}>
                  <div>Drag and drop your file</div>
                  <div>Or click to browse</div>
                </button>
              )}
              {imageList.map((image, index) => (
                <div key={index} className="imageContainer">
                  <img src={image["data_url"]} alt="" width="100" />
                  <div className="imageButtonsContainer">
                    <button onClick={() => onImageUpdate(index)}>Update</button>
                    <button onClick={() => onImageRemove(index)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ImageUploading>
      </div>
    </div>
  );
}
