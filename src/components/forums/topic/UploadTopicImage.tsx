import { useState } from 'react';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import { WebBundlr } from '@bundlr-network/client';
import Lottie from 'lottie-react';

import animationData from '../../../lotties/loader.json';
import { MessageType, PopUpModal } from '../../common';
import { UploadImageLogo } from '../../../assets/UploadImageLogo';
import { errorSummary } from '../../../utils/error';

import { useBundlr } from '../../../utils/hooks';
import { useForum } from '../../../contexts/DispatchProvider';
import { isNil } from 'lodash';

// function decodeByteArray(result: Uint8Array): string {
//   let binary = '';
//   const bytes = new Uint8Array(result);
//   const len = bytes.byteLength;
//   for (let i = 0; i < len; i++) {
//     binary += String.fromCharCode(bytes[i]);
//   }
//   return binary;
// }

// TODO(andrew) move this to a utils file
async function uploadFileWithBundlr(
  file: File,
  bundlr: WebBundlr,
): Promise<URL> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Get the number of bytes necessary for uploading the image
  // const price = await bundlr.getPrice(bytes.length);

  // // Get the current number of atomic
  // const balance = await bundlr.getLoadedBalance();

  // // If the price is more than we can currently pay...
  // if (price.isGreaterThan(balance)) {
  //   await bundlr.fund(price.multipliedBy(2));
  // }

  // const tx = bundlr.createTransaction(bytes);

  // await tx.sign();
  // await tx.upload();

  // const id = tx.id;
  // const url = new URL(`https://arweave.net/${id}`);

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore
  const base64String = btoa(String.fromCharCode.apply(null, bytes));

  const form = new FormData();
  form.append('image', base64String);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const req = await fetch('https://api.imgbb.com/1/upload?key=4ebf7683ff468ee661cff435b6dede07', {
    method: 'POST',
    body: form,
  }).catch((err) => {
    console.log(err);
  });

  const imgData = await req.json();
  const img = imgData.data.display_url;
  // TODO upload to arweave here
  return img;
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
  const [uploadError, setUploadError] = useState(null);

  const bundlr = useBundlr();

  const handleChange = async (imageList: ImageListType) => {
    setProccessingImage(true);
    try {
      // The component only allows 1 file
      const file = imageList[0].file;
      if (!file) {
        console.error('Could not get file for the uploaded image');
        return;
      }
      if (!bundlr) {
        console.error('Could not initialize bundlr');
        return;
      }
      const url = await uploadFileWithBundlr(file, bundlr);
      onSetImageURL(url);
      setImages(imageList);
      setProccessingImage(false);
    } catch (error: any) {
      console.log(error);
      setUploadError(error);
      setProccessingImage(false);
    }
  };

  return (
    <>
      {!isNil(uploadError) && (
        <PopUpModal
          id="vote-info"
          visible
          title="Something went wrong!"
          messageType={MessageType.error}
          body="Could not be uploaded the picture"
          collapsible={{ header: 'Error', content: errorSummary(uploadError) }}
          okButton={
            <a className="okButton" onClick={() => setUploadError(null)}>
              OK
            </a>
          }
          onClose={() => setUploadError(null)}
        />
      )}
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
    </>
  );
}
