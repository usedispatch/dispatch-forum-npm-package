import { useState, useEffect, useMemo, useRef } from "react";
import { Helmet } from "react-helmet";
import { PublicKey } from "@solana/web3.js";

import { MessageType, Spinner } from "../../components/common";
import {
  ConnectionAlert,
  CreateForum,
  ForumContent,
  PoweredByDispatch,
} from "../../components/forums";

import { useForum, useRole } from "./../../contexts/DispatchProvider";
import { getUserRole } from "./../../utils/postbox/userRole";
import { isSuccess, isInitial, isPending } from "../../utils/loading";
import { isError, isNotFoundError } from "../../utils/error";
import { useForumData, useModal } from "../../utils/hooks";
import { getCustomStyles } from "../../utils/getCustomStyles";
import { StarsAlert } from "../../components/forums/StarsAlert";

interface ForumViewProps {
  collectionId: string;
}

export const ForumView = (props: ForumViewProps) => {
  const forumObject = useForum();
  const Role = useRole();
  const { wallet, permission } = forumObject;
  const { publicKey } = wallet;

  const [croppedCollectionID, setCroppedCollectionId] = useState<string>("");

  const { modal, showModal } = useModal();

  const collectionId = props.collectionId;
  const collectionPublicKey = useMemo(() => {
    try {
      const pubkey = new PublicKey(collectionId);

      // TODO(andrew) make croppedCollectionID a useMemo() call as well?
      // see https://www.notion.so/usedispatch/Only-Show-Forums-with-valid-Public-Keys-eaf833a2d69a4bc69f760509b4bfee6d
      setCroppedCollectionId(
        `${collectionId.slice(0, 4)}...${collectionId.slice(-4)}`
      );

      return pubkey;
    } catch (error) {
      const message = JSON.stringify(error);
      console.log(error);
      showModal({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "Invalid Collection ID Public Key",
        collapsible: { header: "Error", content: message },
      });
      return null;
    }
  }, [collectionId]);

  const customStyle = getCustomStyles(collectionId);

  const mount = useRef(false);
  const { forumData, update } = useForumData(collectionPublicKey, forumObject);

  useEffect(() => {
    update();
    // Update every time the cluster is changed
  }, [forumObject.cluster]);

  useEffect(() => {
    if (isSuccess(forumData) && permission.readAndWrite) {
      getUserRole(forumObject, collectionPublicKey!, Role);
    }
  }, [forumData, publicKey]);

  const disconnectedView = (
    <div className="disconnectedView">
      Connect to your wallet in order to see or create a forum
    </div>
  );

  return (
    <div className="dsp-">
      <div className={customStyle}>
        <Helmet>
          <meta charSet="utf-8" />
          {isError(forumData) && isNotFoundError(forumData) && (
            <title>Create Forum for {collectionId}</title>
          )}
          {isSuccess(forumData) && (
            <title>{forumData.description.title} -- Forum</title>
          )}
        </Helmet>
        <div className="forumView">
          {modal}
          {!permission.readAndWrite && <ConnectionAlert />}
          {collectionId === "DSwfRF1jhhu6HpSuzaig1G19kzP73PfLZBPLofkw6fLD" && (
            <StarsAlert />
          )}
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
                      collectionId={collectionId}
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
    </div>
  );
};
