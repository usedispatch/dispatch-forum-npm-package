import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";
import ImageUploading, { ImageListType } from "react-images-uploading";
import { WebBundlr } from "@bundlr-network/client";
import Lottie from 'lottie-react';

import animationData from '../../../lotties/loader.json';
import { MessageType, PopUpModal, Spinner } from "../../common";
import { Notification } from "..";
import { UploadImageLogo } from '../../../assets/UploadImageLogo';

import { useBundlr } from "../../../utils/hooks";
import { useForum } from "../../../contexts/DispatchProvider";

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

interface UploadTopicImageProps {
  onSetImageURL: (url: URL) => void;
  imageUrl: string;
}

export function UploadTopicImage({ onSetImageURL, imageUrl }: UploadTopicImageProps) {
  const forumObject = useForum();
  const { permission } = forumObject;

  const [images, setImages] = useState<any[]>([]);
  const [proccessingImage, setProccessingImage] = useState(false);

  const bundlr = useBundlr();

  const handleChange = async (imageList: ImageListType) => {
    setProccessingImage(true);
    try {
      // The component only allows 1 file
      const file = imageList[0].file;
      if (!file) {
        console.error(`Could not get file for the uploaded image`);
        return;
      }
      if (!bundlr) {
        console.error(`Could not initialize bundlr`);
        return;
      }
      const url = await uploadFileWithBundlr(file, bundlr);
      onSetImageURL(url);
      setImages(imageList);
      setProccessingImage(false);
    } catch (error: any) {
      console.log(error);
      setProccessingImage(false);
    }
  };

  return (
    <ImageUploading
        value={images}
        onChange={handleChange}
        maxNumber={1}
        dataURLKey="data_url"
      >
        {({ onImageUpload }) => (
          proccessingImage
          ? (
            <div className="uploadTopicImageAnimation">
              <Lottie loop animationData={animationData} />
            </div>
          )
          : (
            <button
              className="uploadTopicImageButton"
              disabled={!permission.readAndWrite || !!imageUrl}
              onClick={onImageUpload}>
              <UploadImageLogo className="uploadTopicImageIcon" />
            </button>
          )
        )}
    </ImageUploading>
  );
}
