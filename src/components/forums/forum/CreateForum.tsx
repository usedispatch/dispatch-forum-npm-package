import isNil from 'lodash/isNil';
import { useState, useMemo, ReactNode } from "react";
import Jdenticon from "react-jdenticon";
import ReactGA from "react-ga4";
import { ForumInfo } from "@usedispatch/client";
import { PublicKey } from "@solana/web3.js";

import { Info } from "../../../assets";
import {
  Collapsible,
  MessageType,
  Spinner,
  Tooltip,
  TransactionLink,
} from "../../common";
import { Notification } from "..";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { isSuccess } from '../../../utils/loading';
import { errorSummary } from '../../../utils/error';
import { useModal } from "../../../utils/hooks";
import { pubkeysToRestriction } from "../../../utils/restrictionListHelper";
import { csvStringToPubkeyList } from "../../../utils/csvStringToPubkeyList";
import { getIdentity } from "../../../utils/identity";

interface CreateForumProps {
  forumObject: DispatchForum;
  collectionId: string;
  update: () => Promise<void>;
}

export function CreateForum(props: CreateForumProps) {
  const { collectionId, forumObject, update } = props;
  const { wallet } = forumObject;
  const { publicKey } = wallet;

  const [creatingNewForum, setCreatingNewForum] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newModerator, setNewModerator] = useState("");
  const [newOwners, setNewOwners] = useState("");
  const [accessToken, setAccessToken] = useState<string>("");
  const [modList, setModList] = useState<PublicKey[]>([]);
  const [ownerList, setOwnerList] = useState<PublicKey[]>([]);
  const [accessList, setAccessList] = useState<PublicKey[]>([]);
  const [bodySize, setBodySize] = useState<number>(0);

  const [notification, setNotification] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });

  const { modal, showModal } = useModal();
  const croppedCollectionID = useMemo(() => {
    try {
      const pubkey = new PublicKey(collectionId);

      // TODO(andrew) make croppedCollectionID a useMemo() call as well?
      // see https://www.notion.so/usedispatch/Only-Show-Forums-with-valid-Public-Keys-eaf833a2d69a4bc69f760509b4bfee6d
      return `${collectionId.slice(0, 4)}...${collectionId.slice(-4)}`;
    } catch (error: any) {
      const message = JSON.stringify(error);
      showModal({
        title: "Something went wrong!",
        type: MessageType.error,
        body: "Invalid Collection ID Public Key",
        collapsible: { header: "Error", content: message },
      });
      return null;
    }
  }, [collectionId]);

  const collectionPublicKey = useMemo(() => {
    try {
      const pubkey = new PublicKey(collectionId);
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

  const parseModList = () => {
    try {
      if (newModerator.length > 0) {
        const list = csvStringToPubkeyList(newModerator);
        setModList(list);
      } else {
        setModList([]);
      }
    } catch (e: any) {
      setModList([]);
      setNotification({
        isHidden: false,
        content: <>Error on adding moderator: {e.message}</>,
        type: MessageType.error,
      });
    }
  };

  const parseOwnerList = () => {
    try {
      if (newOwners.length > 0) {
        const list = csvStringToPubkeyList(newOwners);
        setOwnerList(list);
      } else {
        setOwnerList([]);
      }
    } catch (e: any) {
      setOwnerList([]);
      setNotification({
        isHidden: false,
        content: <>Error on adding owner: {e.message}</>,
        type: MessageType.error,
      });
    }
  };

  const parseCollectionList = () => {
    try {
      if (accessToken.length > 0) {
        const list = csvStringToPubkeyList(accessToken);
        setAccessList(list);
      } else {
        setAccessList([]);
      }
    } catch (e: any) {
      setAccessList([]);
      setNotification({
        isHidden: false,
        content: <>Error on limiting access: {e.message}</>,
        type: MessageType.error,
      });
    }
  };

  const onCreateForumClick = () => {
    createForum();
  };

  const createForum = async () => {
    setCreatingNewForum(true);

    if (!wallet) {
      showModal({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
      });
    }

    const moderators = [...modList, publicKey];
    const owners = [...ownerList, publicKey];

    const forum = {
      owners,
      moderators,
      title: title,
      description: description,
      collectionId: collectionPublicKey,
      postRestriction: accessToken
        ? pubkeysToRestriction(accessToken)
        : undefined,
    } as ForumInfo;

    const res = await forumObject.createForum(forum);

    if (isSuccess(res)) {

      if (!isNil(res?.forum)) {
        showModal({
          title: `Success!`,
          body: (
            <div className="successBody">
              <div>{`The forum '${title}' for the collection ${croppedCollectionID} was created`}</div>
              <div>
                {res?.txs.map((tx) => (
                  <TransactionLink transaction={tx} key={tx} />
                ))}
              </div>
            </div>
          ),
          type: MessageType.success,
        });

        if (res?.txs) {
          await Promise.all(
            res.txs.map((tx) => forumObject.connection.confirmTransaction(tx))
          ).then(() => update());
        }
      }
      ReactGA.event("successfulForumCreation");
    } else {
      const error = res;
      ReactGA.event("failedForumCreation");
      showModal({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
        collapsible: { header: "Error", content: errorSummary(error) },
      });
    }
    setCreatingNewForum(false);
  };

  const advancedOptions = (
    <div>
      <div className="formSection">
        <span className="formLabel">
          Add moderators
          <Tooltip
            content={
              <div className="labelTooltip">
                <Info />
              </div>
            }
            message={
              "Your wallet ID will be automatically added as a moderator, but if you'd like to add additional moderators you can specify them here as a comma seperated list!"
            }
          />
        </span>
        <input
          placeholder="Add a comma separated list of moderator IDs"
          className="formInput"
          value={newModerator}
          disabled={creatingNewForum}
          onChange={(e) => setNewModerator(e.target.value)}
          onBlur={() => parseModList()}
        />
        {modList.length > 0 && (
          <ul className="idsList">
            {modList.map((pubkey) => {
              const m = pubkey.toBase58();
              const identity = getIdentity(pubkey);
              return (
                <li key={m} className="addedIds">
                  <>
                    <div className="iconContainer">
                      {identity ? (
                        <img
                          src={identity.profilePicture.href}
                          style={{ borderRadius: "50%" }}
                        />
                      ) : (
                        <Jdenticon value={m} alt="moderatorId" />
                      )}
                    </div>
                    {identity ? identity.displayName : m}
                  </>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="formSection">
        <span className="formLabel">
          Add owners
          <Tooltip
            content={
              <div className="labelTooltip">
                <Info />
              </div>
            }
            message={
              "Your wallet ID will be automatically added as an owner, but if you'd like to add additional owners you can specify them here as a comma seperated list!"
            }
          />
        </span>
        <input
          placeholder="Add a comma separated list of owners IDs"
          className="formInput"
          value={newOwners}
          disabled={creatingNewForum}
          onChange={(e) => setNewOwners(e.target.value)}
          onBlur={() => parseOwnerList()}
        />
        {ownerList.length > 0 && (
          <ul className="idsList">
            {ownerList.map((pubkey) => {
              const o = pubkey.toBase58();
              return (
                <li key={o} className="addedIds">
                  <>
                    <div className="iconContainer">
                      <Jdenticon value={o} alt="ownerId" />
                    </div>
                    {o}
                  </>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="formSection">
        <span className="formLabel">
          Limit forum access
          <Tooltip
            content={
              <div className="labelTooltip">
                <Info />
              </div>
            }
            message={
              "Here, you are able to gate your forum to Metaplex NFT Collection holders. Simply enter the collection ID of your NFT collection and only token holders can create posts. You can find the collection ID in the metadata URI of your NFT."
            }
          />
        </span>
        <input
          placeholder="Add a comma separated list of collection IDs"
          className="formInput lastInputField"
          value={accessToken}
          disabled={creatingNewForum || bodySize > 800}
          onChange={(e) => setAccessToken(e.target.value)}
          onBlur={() => parseCollectionList()}
        />
        {accessList.length > 0 && (
          <ul className="idsList">
            {accessList.map((pubkey) => {
              const a = pubkey.toBase58();
              return (
                <li key={a} className="addedIds">
                  {a}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="dsp- ">
      <div className="createForumContainer">
        {modal}
        <Notification
          hidden={notification.isHidden}
          content={notification?.content}
          type={notification?.type}
          onClose={() => setNotification({ isHidden: true })}
        />
        <div className="createForumTitle">Create New Forum</div>
        <div className="createForumSubtitle">
          Create one to create topics, post, share, rate, and gift tokens.
        </div>
        <div
          className={`createForumForm ${creatingNewForum ? "creating" : ""}`}>
          <div className="formBody">
            <div className="formSection">
              <span className="formLabel">
                Forum ID
                <Tooltip
                  content={
                    <div className="labelTooltip">
                      <Info />
                    </div>
                  }
                  message="This is the unique ID for your forum and generated automatically. This is part of the URL for this forum"
                />
              </span>
              <input
                type="text"
                className={`formInput readonly`}
                required
                value={collectionId}
                readOnly
              />
            </div>
            <div className="formSection">
              <>{ReactGA.send("pageview")}</>
              <span className="formLabel">Title</span>
              <input
                type="text"
                placeholder="Title"
                className="formInput"
                name="name"
                required
                value={title}
                disabled={creatingNewForum}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="formSection">
              <span className="formLabel">Description</span>
              <textarea
                placeholder="Description"
                className="formInput description"
                maxLength={800}
                value={description}
                disabled={creatingNewForum}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setBodySize(new Buffer(e.target.value).byteLength);
                }}
              />
              <div className="textSize">{bodySize}/800</div>
            </div>
            <Collapsible
              header="Show advanced options"
              content={advancedOptions}
            />
            {creatingNewForum && <Spinner />}
            <div className="createForumButtonContainer">
              <button
                type="submit"
                className="acceptCreateForumButton"
                disabled={creatingNewForum || title.length === 0}
                onClick={() => {
                  onCreateForumClick();
                  ReactGA.event("sendForumCreate");
                }}>
                Create forum
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
