import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";
import ImageUploading, { ImageListType } from "react-images-uploading";
import { WebBundlr } from "@bundlr-network/client";

import { MessageType, Spinner } from "../../common";
import { Notification } from "../index";

import { useBundlr } from "../../../utils/hooks";

// TODO(andrew) move this to a utils file
async function uploadFileWithBundlr(
  file: File,
  bundlr: WebBundlr
): Promise<URL> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Get the number of bytes necessary for uploading the image
  const price = await bundlr.getPrice(bytes.length);

  // Get the current number of atomic
  const balance = await bundlr.getLoadedBalance();

  // If the price is more than we can currently pay...
  if (price.isGreaterThan(balance)) {
    await bundlr.fund(price.multipliedBy(2));
  }

  const tx = bundlr.createTransaction(bytes);
  await tx.sign();
  await tx.upload();

  const id = tx.id;

  const url = new URL(`https://arweave.net/${id}`);

  // TODO upload to arweave here
  return url;
}

interface UploadForumImageProps {
  setImageURL: (url: URL) => void;
  currentBanner?: string;
}

export function UploadForumImage(props: UploadForumImageProps) {
  const { setImageURL, currentBanner } = props;

  const [notificationContent, setNotificationContent] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });

  const fileTypes = ["jpg", "png"];

  const [images, setImages] = useState<any[]>([]);
  const [loadingImage, setLoadingImage] = useState(false);

  const bundlr = useBundlr();

  // TODO(andrew) rewrite all of this with error types instead of console.error() calls
  const onChange = async (imageList: ImageListType) => {
    try {
      // The component only allows 1 file
      const file = imageList[0].file;
      if (!file) {
        console.error(`Could not get file for the uploaded image`);
      } else if (!bundlr) {
        console.error(`Could not initialize bundlr`);
      } else {
        setLoadingImage(true);
        await uploadFileWithBundlr(file, bundlr).then((url) =>
          setImageURL(url)
        );
        setLoadingImage(false);
      }
      // Upload
      setImages(imageList);
      // Set the image URL once it is loaded TODO replace this with Arweave
      setImageURL(imageList[0].data_url);
    } catch (error: any) {
      console.log(error);
      setLoadingImage(false);
    }
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
              {loadingImage ? (
                <>
                  <div className="uploadImageLabel">Processing new file</div>
                  <Spinner />
                </>
              ) : imageList.length === 0 ? (
                currentBanner ? (
                  <>
                    <div key="currentbanner" className="imageContainer">
                      <div className="uploadImageLabel">Current banner</div>
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
