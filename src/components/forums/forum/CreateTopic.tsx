import isNil from 'lodash/isNil';
import { useState, ReactNode, useEffect } from 'react';
import { PostRestriction } from '@usedispatch/client';

import { Plus } from '../../../assets';

import { CollapsibleProps, Input, MessageType, PermissionsGate, PopUpModal, TransactionLink } from '../../../components/common';
import {
  Notification,
} from '..';

import { NOTIFICATION_BANNER_TIMEOUT } from '../../../utils/consts';
import { ForumData } from '../../../utils/hooks';
import { isSuccess } from '../../../utils/loading';
import { DispatchError, Result } from '../../../types/error';
import { isError, errorSummary } from '../../../utils/error';
import { SCOPES, UserRoleType } from '../../../utils/permissions';
import { DispatchForum } from '../../../utils/postbox/postboxWrapper';
import { pubkeysToRestriction, pubkeysToSPLRestriction } from '../../../utils/restrictionListHelper';
import { newPublicKey } from '../../../utils/postbox/validateNewPublicKey';

import { useRole } from '../../../contexts/DispatchProvider';

interface CreateTopicProps {
  forumObject: DispatchForum;
  forumData: ForumData;
  currentForumAccessToken: string[];
  update: () => Promise<void>;
  topicInFlight: (title: string) => void;
  onTopicCreated: () => void;
}

export function CreateTopic(props: CreateTopicProps): JSX.Element {
  const { currentForumAccessToken, forumObject, forumData, topicInFlight, update } = props;
  const { roles } = useRole();
  const { permission } = forumObject;

  const [newTopic, setNewTopic] = useState<{
    title: string;
    description: string;
    NFTaccessToken: string;
    SPLaccessToken: string;
    SPLamount: number;
  }>({
    title: '',
    description: '',
    NFTaccessToken: '',
    SPLaccessToken: '',
    SPLamount: 1,
  });

  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [creatingNewTopic, setCreatingNewTopic] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [ungatedNewTopic, setUngatedNewTopic] = useState(currentForumAccessToken.length === 0);
  const [keepGates, setKeepGates] = useState(!ungatedNewTopic);
  const [addNFTGate, setAddNFTGate] = useState(false);
  const [addSPLGate, setAddSPLGate] = useState(false);
  const [tokenGateSelection, setTokenGateSelection] = useState('');

  const [notification, setNotification] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });
  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const createTopic = async (): Promise<void> => {
    const p = {
      subj: newTopic.title,
      body: newTopic.description,
    };

    setCreatingNewTopic(true);
    setAwaitingConfirmation(true);
    let restrictionResult: Result<PostRestriction> | undefined;
    // First case checks if existing gates are kept and new ones being added
    // Second case removes existing gates and adds new ones
    // Third case removes existing gates
    // Final case keeps existing gates
    if (keepGates && addNFTGate && newTopic.NFTaccessToken !== '') {
      restrictionResult = pubkeysToRestriction(
        newTopic.NFTaccessToken,
        isSuccess(forumData.restriction) ? forumData.restriction : undefined,
      );
    } else if (!keepGates && addNFTGate && newTopic.NFTaccessToken !== '') {
      restrictionResult = pubkeysToRestriction(newTopic.NFTaccessToken);
    } else if (
      (!isSuccess(forumData.restriction) || ungatedNewTopic) &&
      addSPLGate &&
      newTopic.SPLaccessToken !== ''
    ) {
      try {
        const splMint = newPublicKey(newTopic.SPLaccessToken);
        if (isSuccess(splMint)) {
          const tokenMetadata = await forumObject.connection.getTokenSupply(
            splMint,
          );
          restrictionResult = pubkeysToSPLRestriction(
            newTopic.SPLaccessToken,
            newTopic.SPLamount,
            tokenMetadata.value.decimals,
          );
        }
      } catch (error) {
        setCreatingNewTopic(false);
        setModalInfo({
          title: 'Something went wrong!',
          type: MessageType.error,
          body: 'The topic could not be created',
          collapsible: { header: 'Error', content: errorSummary(error as DispatchError) },
        });
        setShowNewTopicModal(false);
        return;
      }
    } else if (!keepGates) {
      restrictionResult = { null: {} };
    } else {
      restrictionResult = undefined;
    }
    if (isError(restrictionResult)) {
      const error = restrictionResult;
      setCreatingNewTopic(false);
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The topic could not be created',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
      setShowNewTopicModal(false);
      return;
    }

    const restriction = restrictionResult;
    const tx = await forumObject.createTopic(
      p,
      forumData.collectionId,
      restriction,
    );
    topicInFlight(newTopic.title);
    setCreatingNewTopic(false);

    if (isSuccess(tx)) {
      setShowNewTopicModal(false);
      setNewTopic({
        title: '',
        description: '',
        NFTaccessToken: '',
        SPLaccessToken: '',
        SPLamount: 1,
      });
      setNotification({
        isHidden: false,
        content: (
          <>
            Topic created! You will be redirected in a moment
            <TransactionLink transaction={tx} />
          </>
        ),
        type: MessageType.success,
      });
      setTimeout(
        () => setNotification({ isHidden: true }),
        NOTIFICATION_BANNER_TIMEOUT,
      );

      await forumObject.connection.confirmTransaction(tx);
      await update();
      props.onTopicCreated();
    } else {
      const error = tx;
      setCreatingNewTopic(false);
      topicInFlight('');
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The topic could not be created',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
      setShowNewTopicModal(false);
    }
    setAwaitingConfirmation(false);
  };

  useEffect(() => {
    if (
      !keepGates &&
      (newTopic.NFTaccessToken.length === 0 ||
        newTopic.SPLaccessToken.length === 0)
    ) {
      setUngatedNewTopic(true);
    } else {
      setUngatedNewTopic(false);
      if (tokenGateSelection === 'SPL') {
        topicInFlight('');
      }
    }
  }, [newTopic.SPLaccessToken, newTopic.NFTaccessToken.length, keepGates]);

  useEffect(() => {
    if (tokenGateSelection === 'NFT') {
      setAddNFTGate(true);
      setAddSPLGate(false);
    } else if (tokenGateSelection === 'SPL') {
      setAddNFTGate(false);
      setAddSPLGate(true);
    } else {
      setAddNFTGate(false);
      setAddSPLGate(false);
    }
  }, [tokenGateSelection]);

  let modalContent: {
    title: string;
    body: string | ReactNode;
    okButton: ReactNode;
    cancelButton: ReactNode;
    loading?: boolean;
  };
  if (roles.includes(UserRoleType.Viewer)) {
    modalContent = {
      title: 'You are not authorized',
      body: isSuccess(forumData.restriction) &&
        !isNil(forumData.restriction.tokenOwnership) &&
        isSuccess(forumData.restriction.tokenOwnership) &&
        forumData.restriction.tokenOwnership.mint.equals(
          forumData.moderatorMint,
        )
        ? 'Oops! Only moderators can create new topics at this time.'
        : 'Oops! You need a token to participate. Please contact the forum’s moderators.',
      okButton: (
        <button
          className="okButton"
          onClick={() => setShowNewTopicModal(false)}>
          OK
        </button>
      ),
      cancelButton: (
        <button
          className="cancelButton"
          onClick={() => setShowNewTopicModal(false)}>
          Cancel
        </button>
      ),
    };
  } else {
    modalContent = {
      title: 'Create new Topic',
      body: (
        <div className="createTopicBody">
          <>
            <span className="createTopicLabel">Topic title</span>
            <input
              type="text"
              placeholder="Title"
              className="createTopicTitleInput"
              name="name"
              required
              value={newTopic.title}
              onChange={e =>
                setNewTopic({
                  ...newTopic,
                  title: e.target.value,
                })
              }
            />
          </>
          <>
            <span className="createTopicLabel">
              Topic description
            </span>
            <textarea
              placeholder="Description"
              className="createTopicTitleInput createTopicTextArea"
              maxLength={800}
              value={newTopic.description}
              onChange={e =>
                setNewTopic({
                  ...newTopic,
                  description: e.target.value,
                })
              }
            />
          </>
          <PermissionsGate
            scopes={[SCOPES.canAddTopicRestriction]}>
            <>
              {currentForumAccessToken.length > 0 && (
                <div className="gateCheckbox">
                  <div className="createTopicLabel">
                    Keep existing forum gates on topic
                  </div>
                  <input
                    type="checkbox"
                    checked={keepGates}
                    onChange={e => {
                      setKeepGates(e.target.checked);
                    }}
                  />
                </div>
              )}
              <div className="gateCheckbox">
                <div className="createTopicLabel">
                  Add a Token Gate?
                </div>
                <select
                  value={tokenGateSelection}
                  className="addTokenGateSelect"
                  onChange={e =>
                    setTokenGateSelection(e.target.value)
                  }>
                  <option value="">Select a token type</option>
                  <option value="NFT">Metaplex NFT</option>
                  {ungatedNewTopic && (
                    <option value="SPL">SPL Token</option>
                  )}
                </select>
              </div>
              {addNFTGate && (
                <div>
                  <span className="createTopicLabel">
                    Limit post access by NFT Collection ID
                  </span>
                  <input
                    type="text"
                    placeholder="Metaplex collection ID as comma separated list"
                    className="newAccessToken"
                    name="accessToken"
                    value={newTopic.NFTaccessToken}
                    onChange={e =>
                      setNewTopic({
                        ...newTopic,
                        NFTaccessToken: e.target.value,
                      })
                    }
                  />
                </div>
              )}
              {addSPLGate && (
                <div>
                  <span className="createTopicLabel">
                    Limit post access by SPL Mint ID
                  </span>
                  <input
                    type="text"
                    placeholder="Token mint ID"
                    className="newAccessToken"
                    name="accessToken"
                    value={newTopic.SPLaccessToken}
                    onChange={e => {
                      setNewTopic({
                        ...newTopic,
                        SPLaccessToken: e.target.value,
                      });
                    }}
                  />
                  <span className="createTopicLabel">Amount</span>
                  <Input
                    type="number"
                    value={1.0}
                    min={0}
                    step={0.01}
                    className="newAccessToken"
                    onChange={value => {
                      setNewTopic({
                        ...newTopic,
                        SPLamount: parseFloat(value),
                      });
                    }}
                  />
                </div>
              )}
            </>
          </PermissionsGate>
        </div>
      ),
      loading: creatingNewTopic,
      okButton: (
        <button
          className="okButton"
          disabled={newTopic.title.length === 0}
          onClick={async () => createTopic()}>
          Create
        </button>
      ),
      cancelButton: (
        <button
          className="cancelButton"
          onClick={() => setShowNewTopicModal(false)}>
          Cancel
        </button>
      ),
    };
  }

  return (
    <div className='createTopic'>
      <Notification
        hidden={notification.isHidden}
        content={notification?.content}
        type={notification?.type}
        onClose={() => setNotification({ isHidden: true })}
      />
      {!isNil(modalInfo) && (
        <PopUpModal
          id="create-topic-info"
          visible
          title={modalInfo.title}
          messageType={modalInfo.type}
          body={modalInfo.body}
          collapsible={modalInfo.collapsible}
          onClose={() => setModalInfo(null)}
          okButton={
            <a className="okButton" onClick={() => setModalInfo(null)}>
              OK
            </a>
          }
        />
      )}
      {showNewTopicModal && (
        <PopUpModal
          id="create-topic"
          visible
          title={modalContent.title}
          body={modalContent.body}
          loading={creatingNewTopic}
          onClose={() => setShowNewTopicModal(false)}
          okButton={modalContent.okButton}
        />
      )}
      <button
        className={`createTopicButton ${creatingNewTopic ? 'loading' : ''}`}
        type="button"
        disabled={!permission.readAndWrite || awaitingConfirmation}
        onClick={() => {
          setShowNewTopicModal(true);
        }}>
        <div className="buttonImageContainer">
          <Plus />
        </div>
        Create Topic
      </button>
    </div>
  );
}
