import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";
import ImageUploading, { ImageListType } from "react-images-uploading";

import { MessageType } from "../../common";
import { Notification } from "../index";

// TODO(andrew) move this to a utils file
async function uploadFileToArweave(file: File): Promise<URL> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // TODO upload to arweave here
  return new URL('');
}

interface UploadForumImageProps {
  setImageURL: (url: URL) => void;
  currentBanner?: string;
}

export function UploadForumImage(props: UploadForumImageProps) {
  const { setImageURL, currentBanner  } = props;

  const [notificationContent, setNotificationContent] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });

  const fileTypes = ["png"];

  const [images, setImages] = useState<any[]>([]);

  // TODO(andrew) rewrite all of this with error types instead of
  // console.error() calls
  const onChange = (imageList: ImageListType) => {
    // Make sure we've uploaded exactly one file
    if (imageList.length === 1) {
      const file = imageList[0].file;
      if (file) {
        uploadFileToArweave(file)
          .then(url => setImageURL(url));
      } else {
        console.error(`Could not get file for the uploaded image`);
      }
    } else {
      console.error(`Should upload exactly one image. Uploaded ${imageList.length}`);
    }
    // Upload
    setImages(imageList);
    // Set the image URL once it is loaded TODO replace this with
    // Arweave
    setImageURL(imageList[0].data_url);
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
            isDragging,
            dragProps,
          }) => (
            <div className="uploadImageWrapper">
              {imageList.length === 0 ? (
                currentBanner ? (
                  <>
                    <div
                      key="currentbanner"
                      className="imageContainer currentBanner">
                      <div>Current banner</div>
                      <img src={currentBanner} alt="" width="180" />
                    </div>
                    <button
                      style={isDragging ? { color: "red" } : undefined}
                      className="dragAndDropButton"
                      onClick={onImageUpload}
                      {...dragProps}>
                      <div>To change the banner drag and drop your file</div>
                      <div>Or click to browse</div>
                    </button>
                  </>
                ) : (
                  <button
                    style={isDragging ? { color: "red" } : undefined}
                    className="dragAndDropButton"
                    onClick={onImageUpload}
                    {...dragProps}>
                    <div>Drag and drop your file</div>
                    <div>Or click to browse</div>
                  </button>
                )
              ) : (
                imageList.map((image, index) => (
                  <div key={index} className="imageContainer">
                    <img src={image["data_url"]} alt="" width="180" />
                    <div className="imageButtonsContainer">
                      <button onClick={() => onImageUpdate(index)}>
                        Update
                      </button>
                      <button onClick={() => setImages([])}>Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </ImageUploading>
      </div>
    </div>
  );
}
