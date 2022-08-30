import * as _ from "lodash";
import { useState, ReactNode, useEffect, useMemo } from "react";
import { ForumInfo } from "@usedispatch/client";
import * as web3 from "@solana/web3.js";
import ReactGA from "react-ga4";

import { Lock, Plus, Trash } from "../../../assets";
import {
  Collapsible,
  CollapsibleProps,
  MessageType,
  PopUpModal,
  TransactionLink,
} from "../../common";

import { DispatchForum } from "../../../utils/postbox/postboxWrapper";
import { newPublicKey } from "../../../utils/postbox/validateNewPublicKey";
import { isSuccess } from "../../../utils/loading";
import { useModal } from "../../../utils/hooks";
import { pubkeysToRestriction } from "../../../utils/restrictionListHelper";
import { csvStringToPubkeyList } from "../../../utils/csvStringToPubkeyList";

interface CreateForumProps {
  forumObject: DispatchForum;
  collectionId: string;
  update: () => Promise<void>;
}

export function CreateForum(props: CreateForumProps) {
  const { collectionId, forumObject, update } = props;
  const { wallet } = forumObject;
  const { publicKey } = wallet;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creatingNewForum, setCreatingNewForum] = useState(false);
  const [newModerator, setNewModerator] = useState("");
  const [newOwners, setNewOwners] = useState("");
  const [accessToken, setAccessToken] = useState<string>("");
  const [bodySize, setBodySize] = useState<number>(0);
  const [modList, setModList] = useState<web3.PublicKey[]>([]);
  const [ownerList, setOwnerList] = useState<web3.PublicKey[]>([]);
  const [accessList, setAccessList] = useState<web3.PublicKey[]>([]);

  const { modal, showModal } = useModal();
  const croppedCollectionID = useMemo(() => {
    try {
      const pubkey = new web3.PublicKey(collectionId);

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
      const pubkey = new web3.PublicKey(collectionId);
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
      const list = csvStringToPubkeyList(newModerator);
      setModList(list);
    } catch (e: any) {
      setModList([]);
      showModal({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
        collapsible: { header: "Error", content: e.message },
      });
    }
  };

  const parseOwnerList = () => {
    try {
      const list = csvStringToPubkeyList(newOwners);
      setOwnerList(list);
    } catch (e: any) {
      setOwnerList([]);
      showModal({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
        collapsible: { header: "Error", content: e.message },
      });
    }
  };

  const parseCollectionList = () => {
    try {
      const list = csvStringToPubkeyList(accessToken);
      setAccessList(list);
    } catch (e: any) {
      setAccessList([]);
      showModal({
        title: "Something went wrong!",
        type: MessageType.error,
        body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
        collapsible: { header: "Error", content: e.message },
      });
    }
  };

  const onCreateForumClick = () => {
    createForum();
  };

  const createForum = async () => {
    setCreatingNewForum(true);

    try {
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

      if (!_.isNil(res?.forum)) {
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
    } catch (e: any) {
      ReactGA.event("failedForumCreation");
      if (e.error?.code !== 4001) {
        showModal({
          title: "Something went wrong!",
          type: MessageType.error,
          body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
          collapsible: { header: "Error", content: e.message },
        });
      }
    } finally {
      setCreatingNewForum(false);
    }
  };

  return (
    <div className="dsp- ">
      <div className="createForumContainer">
        <div className="createForumTitle">Create New Forum</div>
        <div className="createForumSubtitle">
          Create one to create topics, post, share, rate, and gift tokens.
        </div>
        <div className="createForumForm">
          <div className="formBody">
            <>
              {ReactGA.send("pageview")}
              <span className="formLabel">Forum Title</span>
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
            </>
            <>
              <span className="formLabel">Forum Description</span>
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
            </>
            <Collapsible
              header="Advanced options"
              content={
                <div>
                  <>
                    <span className="formLabel">Add Moderators</span>
                    <input
                      placeholder="Add a comma separated list of moderator IDs"
                      className="formInput"
                      value={newModerator}
                      disabled={creatingNewForum}
                      onChange={(e) => setNewModerator(e.target.value)}
                      onBlur={(e) => parseModList()}
                    />
                    {modList?.map((mod) => (
                      <div key={mod.toBase58()}>{mod.toBase58()}</div>
                    ))}
                  </>
                  <>
                    <span className="formLabel">Add Owners</span>
                    <input
                      placeholder="Add a comma separated list of owners IDs"
                      className="formInput"
                      value={newOwners}
                      disabled={creatingNewForum}
                      onChange={(e) => setNewOwners(e.target.value)}
                      onBlur={(e) => parseOwnerList()}
                    />
                    <div>
                      {ownerList?.map((owner) => (
                        <div key={owner.toBase58()}>{owner.toBase58()}</div>
                      ))}
                    </div>
                  </>
                  <>
                    <span className="formLabel">Limit forum access</span>
                    <input
                      placeholder="Add a comma separated list of collection IDs"
                      className="formInput lastInputField"
                      value={accessToken}
                      disabled={creatingNewForum || bodySize > 800}
                      onChange={(e) => setAccessToken(e.target.value)}
                      onBlur={(e) => parseCollectionList()}
                    />
                    <div>
                      {accessList?.map((token) => {
                        const tokenB58 = token.toBase58();
                        return <div key={tokenB58}>{tokenB58}</div>;
                      })}
                    </div>
                  </>
                </div>
              }
            />
            <div className="createForumButtonContainer">
              <button
                className="cancelCreateForumButton"
                disabled={creatingNewForum}
                onClick={() => ReactGA.event("cancelForumCreate")}>
                Cancel
              </button>
              <button
                type="submit"
                className="acceptCreateForumButton"
                disabled={creatingNewForum || title.length === 0}
                onClick={() => {
                  onCreateForumClick();
                  ReactGA.event("sendForumCreate");
                }}>
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/*<div
              className="collapse collapse-arrow border border-base-100 bg-base-content rounded-box"
              tabIndex={0}>
              <input type="checkbox" />
              <div className="collapse-title font-medium">Advanced Options</div>
              <div className="collapse-content">
                <>
                  <span className="createForumLabel">Add Moderators</span>
                  <div className="dropdown">
                    <label
                      tabIndex={0}
                      className="btn btn-circle btn-ghost btn-xs text-info">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="w-4 h-4 stroke-current">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </label>
                    <div
                      tabIndex={0}
                      className="card compact dropdown-content shadow bg-base-100 rounded-box w-64">
                      <div className="card-body">
                        <p>
                          Your wallet ID will be automatically added as a
                          moderator, but if you'd like to add additional
                          moderators you can specify them here as a comma
                          seperated list!
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    placeholder="Add a comma separated list of moderator IDs"
                    className="createForumInput"
                    value={newModerator}
                    disabled={creatingNewForum}
                    onChange={(e) => setNewModerator(e.target.value)}
                    onBlur={(e) => parseModList()}
                  />
                  {modList?.map((mod) => {
                    return <div>{mod.toBase58()}</div>;
                  })}
                </>
                <>
                  <span className="createForumLabel">Add Owners</span>
                  <div className="dropdown dropdown-end dropdown-right">
                    <label
                      tabIndex={0}
                      className="btn btn-circle btn-ghost btn-xs text-info">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="w-4 h-4 stroke-current">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </label>
                    <div
                      tabIndex={0}
                      className="card compact dropdown-content shadow bg-base-100 rounded-box w-64">
                      <div className="card-body">
                        <p>
                          Your wallet ID will be automatically added as an
                          owner, but if you'd like to add additional owners you
                          can specify them here as a comma seperated list!
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    placeholder="Add a comma separated list of owners IDs"
                    className="createForumInput"
                    value={newOwners}
                    disabled={creatingNewForum}
                    onChange={(e) => setNewOwners(e.target.value)}
                    onBlur={(e) => parseOwnerList()}
                  />
                  <div>
                    {ownerList?.map((owner) => {
                      return (
                        <div key={owner.toBase58()}>{owner.toBase58()}</div>
                      );
                    })}
                  </div>
                </>
                <>
                  <span className="createForumLabel">Limit forum access</span>
                  <div className="dropdown dropdown-end dropdown-right">
                    <label
                      tabIndex={0}
                      className="btn btn-circle btn-ghost btn-xs text-info">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="w-4 h-4 stroke-current">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </label>
                    <div
                      tabIndex={0}
                      className="card compact dropdown-content shadow bg-base-100 rounded-box w-64">
                      <div className="card-body">
                        <p>
                          Here, you are able to gate your forum to Metaplex NFT
                          Collection holders. Simply enter the collection ID of
                          your NFT collection and only token holders can create
                          posts. You can find the collection ID in the metadata
                          URI of your NFT.
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    placeholder="Add a comma separated list of collection IDs"
                    className="createForumInput lastInputField"
                    value={accessToken}
                    disabled={creatingNewForum || bodySize > 800}
                    onChange={(e) => setAccessToken(e.target.value)}
                    onBlur={(e) => parseCollectionList()}
                  />
                  <div>
                    {accessList?.map((token) => {
                      const tokenB58 = token.toBase58();
                      return <div key={tokenB58}>{tokenB58}</div>;
                    })}
                  </div>
                </>
              </div>
            </div>*/
