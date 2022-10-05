import isNil from 'lodash/isNil';
import { useState, useMemo, ReactNode } from 'react';
import Jdenticon from 'react-jdenticon';
import ReactGA from 'react-ga4';
import { ForumInfo } from '@usedispatch/client';
import { PublicKey } from '@solana/web3.js';

import { Info } from '../../../assets';
import {
  Collapsible,
  MessageType,
  Spinner,
  Tooltip,
} from '../../common';
import { Notification } from '..';

import { DispatchForum } from '../../../utils/postbox/postboxWrapper';
import { isSuccess } from '../../../utils/loading';
import { useModal } from '../../../utils/hooks';
import { pubkeysToRestriction } from '../../../utils/restrictionListHelper';
import { csvStringToPubkeyList } from '../../../utils/csvStringToPubkeyList';
import { getIdentity } from '../../../utils/identity';

interface CreateForumProps {
  forumObject: DispatchForum;
  collectionId: string;
  sendCreateForum: (info: ForumInfo) => void;
  update: () => Promise<void>;
}

export function CreateForum(props: CreateForumProps): JSX.Element {
  const { collectionId, forumObject, sendCreateForum } = props;
  const { wallet } = forumObject;
  const { publicKey } = wallet;

  const [creatingNewForum, setCreatingNewForum] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newModerator, setNewModerator] = useState('');
  const [newOwners, setNewOwners] = useState('');
  const [accessToken, setAccessToken] = useState<string>('');
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
      return `${collectionId.slice(0, 4)}...${collectionId.slice(-4)}`;
    } catch (error: any) {
      const message = JSON.stringify(error);
      showModal({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'Invalid Collection ID Public Key',
        collapsible: { header: 'Error', content: message },
      });
      return '';
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
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'Invalid Collection ID Public Key',
        collapsible: { header: 'Error', content: message },
      });
      return null;
    }
  }, [collectionId]);

  const parseModList = (): void => {
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

  const parseOwnerList = (): void => {
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

  const parseCollectionList = (): void => {
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

  const createForum = (): void => {
    setCreatingNewForum(true);

    if (isNil(wallet) || isNil(collectionPublicKey)) {
      showModal({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: `The forum '${title}' for the collection ${croppedCollectionID} could not be created.`,
      });
      return;
    }

    const moderators = [...modList, publicKey];
    const owners = [...ownerList, publicKey];
    let postRestriction;
    if (accessToken.length > 0) {
      const result = pubkeysToRestriction(accessToken);
      if (isSuccess(result)) {
        postRestriction = result;
      }
    }

    const forum: ForumInfo = {
      owners,
      moderators,
      title,
      description,
      collectionId: collectionPublicKey,
      postRestriction,
    };

    sendCreateForum(forum);
    setTimeout(() => setCreatingNewForum(false), 3000);
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
          onChange={e => setNewModerator(e.target.value)}
          onBlur={() => parseModList()}
        />
        {modList.length > 0 && (
          <ul className="idsList">
            {modList.map(pubkey => {
              const m = pubkey.toBase58();
              const identity = getIdentity(pubkey);
              return (
                <li key={m} className="addedIds">
                  <div className="iconContainer">
                    {isNil(identity)
                      ? (
                      <Jdenticon value={m} alt="moderatorId" />
                      )
                      : (
                      <img
                        src={identity.profilePicture.href}
                        style={{ borderRadius: '50%' }}
                      />
                      )}
                  </div>
                  <div className="displayName">
                    {isNil(identity) ? m : identity.displayName}
                  </div>
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
          onChange={e => setNewOwners(e.target.value)}
          onBlur={() => parseOwnerList()}
        />
        {ownerList.length > 0 && (
          <ul className="idsList">
            {ownerList.map(pubkey => {
              const o = pubkey.toBase58();
              return (
                <li key={o} className="addedIds">
                  <div className="iconContainer">
                    <Jdenticon value={o} alt="ownerId" />
                  </div>
                  <div className="displayName">{o}</div>
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
              'Here, you are able to gate your forum to Metaplex NFT Collection holders. Simply enter the collection ID of your NFT collection and only token holders can create posts. You can find the collection ID in the metadata URI of your NFT.'
            }
          />
        </span>
        <input
          placeholder="Add a comma separated list of collection IDs"
          className="formInput lastInputField"
          value={accessToken}
          disabled={creatingNewForum || bodySize > 800}
          onChange={e => setAccessToken(e.target.value)}
          onBlur={() => parseCollectionList()}
        />
        {accessList.length > 0 && (
          <ul className="idsList">
            {accessList.map(pubkey => {
              const a = pubkey.toBase58();
              return (
                <li key={a} className="addedIds">
                  <div className="displayName">{a}</div>
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
          className={`createForumForm ${creatingNewForum ? 'creating' : ''}`}>
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
                className={'formInput readonly'}
                required
                value={collectionId}
                readOnly
              />
            </div>
            <div className="formSection">
              <>{ReactGA.send('pageview')}</>
              <span className="formLabel">Title</span>
              <input
                type="text"
                placeholder="Title"
                className="formInput"
                name="name"
                required
                value={title}
                disabled={creatingNewForum}
                onChange={e => setTitle(e.target.value)}
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
                onChange={e => {
                  setDescription(e.target.value);
                  setBodySize(Buffer.from(e.target.value).byteLength);
                }}
              />
              <div className="textSize">{bodySize}/800</div>
            </div>
            <Collapsible header="Advanced options" content={advancedOptions} />
            <div className="createForumButtonContainer">
              <button
                type="submit"
                className="acceptCreateForumButton"
                disabled={creatingNewForum || title.length === 0}
                onClick={async () => {
                  createForum();
                  ReactGA.event('sendForumCreate');
                }}>
                {creatingNewForum && <Spinner />}
                Create forum
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
