import isNil from 'lodash/isNil';
import { PublicKey } from '@solana/web3.js';
import Markdown from 'markdown-to-jsx';
import { useState, ReactNode, useEffect } from 'react';
import ReactGA from 'react-ga4';
import { PostRestriction } from '@usedispatch/client';

import { Lock, Plus, Trash } from '../../../assets';
import {
  CollapsibleProps,
  Input,
  MessageType,
  PermissionsGate,
  PopUpModal,
  TransactionLink,
  Spinner,
} from '../../common';
import {
  TopicList,
  EditForum,
  ManageOwners,
  ManageModerators,
  UploadForumBanner,
  ConnectionAlert,
  Notification,
} from '..';
import { useRole } from '../../../contexts/DispatchProvider';

import { DispatchForum } from '../../../utils/postbox/postboxWrapper';
import { SCOPES, UserRoleType } from '../../../utils/permissions';
import { Result } from '../../../types/error';
import { isError, errorSummary } from '../../../utils/error';
import { isSuccess } from '../../../utils/loading';
import {
  ForumData,
  useForumIdentity,
  ForumIdentity,
} from '../../../utils/hooks';
import {
  restrictionListToString,
  pubkeysToRestriction,
  pubkeysToSPLRestriction,
} from '../../../utils/restrictionListHelper';
import { newPublicKey } from '../../../utils/postbox/validateNewPublicKey';
import { csvStringToPubkeyList } from '../../../utils/csvStringToPubkeyList';
import { StarsAlert } from '../StarsAlert';

interface ForumContentProps {
  forumObject: DispatchForum;
  forumData: ForumData;
  update: () => Promise<void>;
}

export function ForumContent(props: ForumContentProps): JSX.Element {
  const { forumData, forumObject, update } = props;
  const { roles } = useRole();
  const { permission } = forumObject;

  const forumIdentity = useForumIdentity(forumData.collectionId);

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
  const [newTopicInFlight, setNewTopicInFlight] = useState(false);
  const [keepGates, setKeepGates] = useState(true);
  const [addNFTGate, setAddNFTGate] = useState(false);
  const [addSPLGate, setAddSPLGate] = useState(false);
  const [tokenGateSelection, setTokenGateSelection] = useState('');
  const [notification, setNotification] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });
  const [ungatedNewTopic, setUngatedNewTopic] = useState(false);
  const [accessList, setAccessList] = useState<PublicKey[]>([]);

  const [showManageAccessToken, setShowManageAccessToken] = useState(false);
  const [removeAccessToken, setRemoveAccessToken] = useState<{
    show: boolean;
    removing: boolean;
    token?: string;
  }>({ show: false, removing: false });
  const [currentForumAccessToken, setCurrentForumAccessToken] = useState<
  string[]
  >(() => {
    if (isSuccess(forumData.restriction)) {
      return restrictionListToString(forumData.restriction);
    } else return [];
  });
  const [newForumAccessToken, setNewForumAccessToken] = useState<string>('');
  const [newForumAccessTokenAmount, setNewForumAccessTokenAmount] =
    useState<number>(1);

  const [addingAccessToken, setAddingAccessToken] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string | ReactNode;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const addAccessToken = async (): Promise<void> => {
    setAddingAccessToken(true);
    let restriction;
    if (addNFTGate) {
      restriction = pubkeysToRestriction(
        newForumAccessToken,
        isSuccess(forumData.restriction) ? forumData.restriction : undefined,
      );
    } else {
      try {
        const splMint = newPublicKey(newForumAccessToken);

        if (isSuccess(splMint)) {
          const tokenMetadata = await forumObject.connection.getTokenSupply(
            splMint,
          );
          restriction = pubkeysToSPLRestriction(
            newForumAccessToken,
            newForumAccessTokenAmount,
            tokenMetadata.value.decimals,
          );
        }
      } catch (error) {
        setAddingAccessToken(false);
        setModalInfo({
          title: 'Something went wrong!',
          type: MessageType.error,
          body: 'The topic could not be created',
          collapsible: { header: 'Error', content: errorSummary(error) },
        });
        setShowManageAccessToken(false);
        return;
      }
    }

    if (isError(restriction)) {
      const error = restriction;
      setAddingAccessToken(false);
      setShowManageAccessToken(false);
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The access token could not be added',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
      return;
    }

    const currentIds = restrictionListToString(restriction);
    const tx = await forumObject.setForumPostRestriction(
      forumData.collectionId,
      restriction,
    );

    if (isSuccess(tx)) {
      setCurrentForumAccessToken(
        currentForumAccessToken.concat([newForumAccessToken]),
      );
      setNewForumAccessToken('');
      setShowManageAccessToken(false);
      setAddingAccessToken(false);
      setAddNFTGate(false);
      setAddSPLGate(false);
      setModalInfo({
        title: 'Success!',
        type: MessageType.success,
        body: (
          <div className="successBody">
            <div>The access token was added</div>
            <TransactionLink transaction={tx} />
          </div>
        ),
      });
      setCurrentForumAccessToken(currentIds);
    } else {
      const error = tx;
      setAddingAccessToken(false);
      setShowManageAccessToken(false);
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The access token could not be added',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
    }
  };

  const deleteAccessToken = async (): Promise<void> => {
    setRemoveAccessToken({ ...removeAccessToken, removing: true });
    const filteredTokens = currentForumAccessToken.filter(
      t => t !== removeAccessToken.token,
    );

    let tx: Result<string>;
    if (filteredTokens.length > 0) {
      const restrictionList = pubkeysToRestriction(filteredTokens.join(','));
      if (isError(restrictionList)) {
        const error = restrictionList;
        setRemoveAccessToken({ show: false, removing: false });
        setModalInfo({
          title: 'Something went wrong!',
          type: MessageType.error,
          body: 'The access token could not be removed',
          collapsible: { header: 'Error', content: errorSummary(error) },
        });
        return;
      }
      tx = await forumObject.setForumPostRestriction(
        forumData.collectionId,
        restrictionList,
      );
    } else {
      tx = await forumObject.deleteForumPostRestriction(forumData.collectionId);
    }

    setCurrentForumAccessToken(filteredTokens);
    setRemoveAccessToken({ show: false, removing: false });

    if (isSuccess(tx)) {
      setModalInfo({
        title: 'Success!',
        type: MessageType.success,
        body: (
          <div className="successBody">
            <div>The access token was removed.</div>
            <TransactionLink transaction={tx} />
          </div>
        ),
      });
    } else {
      const error = tx;
      setRemoveAccessToken({ show: false, removing: false });
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The access token could not be removed',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
    }
  };

  const createTopic = async (): Promise<void> => {
    const p = {
      subj: newTopic.title,
      body: newTopic.description,
    };

    setCreatingNewTopic(true);
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
      // TODO: turn into a util function later
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
          collapsible: { header: 'Error', content: errorSummary(error) },
        });
        setShowNewTopicModal(false);
        return;
      }
    } else if (!keepGates) {
      restrictionResult = { null: {} };
    } else {
      // No restriction
      restrictionResult = undefined;
    }
    console.log('restrictionResult', restrictionResult);
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

    // the possibility of error is no longer present, so rename
    // this variable restriction
    const restriction = restrictionResult;

    const tx = await forumObject.createTopic(
      p,
      forumData.collectionId,
      restriction,
    );
    if (isSuccess(tx)) {
      setCreatingNewTopic(false);
      setNewTopicInFlight(true);
      setModalInfo({
        body: <TransactionLink transaction={tx} />,
        type: MessageType.success,
        title: 'Topic created!',
      });
      setNewTopic({
        title: '',
        description: '',
        NFTaccessToken: '',
        SPLaccessToken: '',
        SPLamount: 1,
      });
      setShowNewTopicModal(false);

      // re-load forum in background
      await forumObject.connection.confirmTransaction(tx).then(() => {
        void update();
        setNewTopicInFlight(false);
      });
    } else {
      const error = tx;
      setCreatingNewTopic(false);
      setModalInfo({
        title: 'Something went wrong!',
        type: MessageType.error,
        body: 'The topic could not be created',
        collapsible: { header: 'Error', content: errorSummary(error) },
      });
      setShowNewTopicModal(false);
    }
  };

  const createTopicButton = (
    <button
      className={'createTopicButton'}
      type="button"
      disabled={!permission.readAndWrite}
      onClick={() => {
        setShowNewTopicModal(true);
      }}>
      <div className="buttonImageContainer">
        <Plus />
      </div>
      Create Topic
    </button>
  );

  const parseCollectionList = (accessListString): void => {
    try {
      if (accessListString.length > 0) {
        const list = csvStringToPubkeyList(accessListString);
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

  const forumHeader = (
    <div className="forumContentHeader">
      <div className={'titleBox'}>
        {currentForumAccessToken.length > 0 && (
          <div className="gatedForum">
            <Lock />
          </div>
        )}
        <Markdown>{forumData.description.title}</Markdown>
        {/* TODO(andrew) what to render here if title isn't loaded */}
      </div>
      <div className="descriptionBox">
        <div className="description">
          <Markdown>{forumData.description.desc}</Markdown>
        </div>
        {createTopicButton}
      </div>
    </div>
  );

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
        setTokenGateSelection('');
      }
    }
  }, [newTopic.SPLaccessToken, newTopic.NFTaccessToken.length, keepGates]);

  useEffect(() => {
    parseCollectionList(newForumAccessToken);
  }, [newForumAccessToken]);

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

  return (
    <div className="dsp- ">
      <div className="forumContent">
        <>
          {ReactGA.send('pageview')}
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
              okButton={
                <a className="okButton" onClick={() => setModalInfo(null)}>
                  OK
                </a>
              }
            />
          )}
          {showManageAccessToken && isNil(modalInfo) && (
            <PopUpModal
              id="add-access-token"
              visible
              title="Limit forum access"
              body={
                <div className="addModeratorsBody">
                  <div className="gateCheckbox">
                    <div className="createTopicLabel">Add a Token Gate?</div>
                    <select
                      value={tokenGateSelection}
                      onChange={e => setTokenGateSelection(e.target.value)}
                      className="addTokenGateSelect">
                      <option value="">Select a token type</option>
                      <option value="NFT">Metaplex NFT</option>
                      {!isSuccess(forumData.restriction) && (
                        <option value="SPL">SPL Token</option>
                      )}
                    </select>
                  </div>
                  {addNFTGate && (
                    <div>
                      <label className="addModeratorsLabel">
                        Add new NFT Collection ID
                      </label>
                      <div>
                        You can enter a list of Metaplex NFT Collection IDs here
                        such that only holders of NFTs in the collection can
                        participate in this forum.
                      </div>
                      <input
                        type="text"
                        placeholder="Enter NFT Collection IDs as a comma separted list"
                        className="newAccessToken"
                        name="accessToken"
                        value={newForumAccessToken}
                        onChange={e => setNewForumAccessToken(e.target.value)}
                      />
                    </div>
                  )}
                  {addSPLGate && (
                    <div className="addSPLToken">
                      <span className="createTopicLabel">
                        Limit post access by SPL Mint ID
                      </span>
                      <input
                        type="text"
                        placeholder="Token mint ID"
                        className="newAccessToken"
                        name="accessToken"
                        value={newForumAccessToken}
                        onChange={e => {
                          setNewForumAccessToken(e.target.value);
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
                          setNewForumAccessTokenAmount(parseFloat(value));
                        }}
                      />
                    </div>
                  )}
                  {newForumAccessToken.length > 0 &&
                    accessList.map(pubkey => {
                      const a = pubkey.toBase58();

                      return (
                        <li key={a} className="addedIds">
                          <div className="displayName">{a}</div>
                        </li>
                      );
                    })}
                  <label className="addModeratorsLabel">
                    Current NFT Collection ID
                  </label>
                  {currentForumAccessToken.length === 0
                    ? (
                      <div className="noRestriction">
                        The forum has no restriction
                      </div>
                    )
                    : (
                    <ul>
                      {currentForumAccessToken.map((token, index) => {
                        return (
                          <li className="currentToken" key={index}>
                            <div className="token">{token}</div>
                            <div
                              onClick={() => {
                                setShowManageAccessToken(false);
                                setRemoveAccessToken({
                                  ...removeAccessToken,
                                  show: true,
                                  token,
                                });
                              }}>
                              <Trash />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    )}
                </div>
              }
              loading={addingAccessToken}
              onClose={() => {
                setShowManageAccessToken(false);
                setAddSPLGate(false);
                setAddNFTGate(false);
                setNewForumAccessToken('');
              }}
              okButton={
                <button
                  className="okButton"
                  onClick={async () => addAccessToken()}>
                  Save
                </button>
              }
            />
          )}
          {removeAccessToken.show && isNil(modalInfo) && (
            <PopUpModal
              id="remove-access-token"
              visible
              title="Are you sure you want to remove NFT Collection ID?"
              body={
                <div>
                  This action will remove the token
                  {` ${removeAccessToken.token?.substring(0, 4)}...`}
                  {`${removeAccessToken.token?.slice(-4)} `} from gating the
                  forum.
                </div>
              }
              loading={removeAccessToken.removing}
              onClose={() =>
                setRemoveAccessToken({ show: false, removing: false })
              }
              okButton={
                <button
                  className="okButton"
                  onClick={async () => deleteAccessToken()}>
                  Remove
                </button>
              }
            />
          )}
          {(() => {
            if (showNewTopicModal && isNil(modalInfo)) {
              if (roles.includes(UserRoleType.Viewer)) {
                return (
                  <PopUpModal
                    id="create-topic"
                    title="You are not authorized"
                    body={
                      isSuccess(forumData.restriction) &&
                      !isNil(forumData.restriction.tokenOwnership) &&
                      isSuccess(forumData.restriction.tokenOwnership) &&
                      forumData.restriction.tokenOwnership.mint.equals(
                        forumData.moderatorMint,
                      )
                        ? 'Oops! Only moderators can create new topics at this time.'
                        : 'Oops! You need a token to participate. Please contact the forum’s moderators.'
                    }
                    visible
                    okButton={
                      <button
                        className="okButton"
                        onClick={() => setShowNewTopicModal(false)}>
                        OK
                      </button>
                    }
                  />
                );
              } else {
                return (
                  <PopUpModal
                    id="create-topic"
                    visible
                    title={'Create new Topic'}
                    body={
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
                              <div className="addSPLToken">
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
                    }
                    loading={creatingNewTopic}
                    okButton={
                      <button
                        className="okButton"
                        disabled={newTopic.title.length === 0}
                        onClick={async () => createTopic()}>
                        Create
                      </button>
                    }
                    cancelButton={
                      <button
                        className="cancelButton"
                        onClick={() => setShowNewTopicModal(false)}>
                        Cancel
                      </button>
                    }
                  />
                );
              }
            } else {
              return null;
            }
          })()}
          <div
            className="forumContentBox"
            style={{
              backgroundImage:
                !isNil(forumData.images?.background) &&
                forumData.images.background.length > 0
                  ? `url(${forumData.images?.background})`
                  : undefined,
            }}>
            {!permission.readAndWrite && <ConnectionAlert />}
            {forumData.collectionId.toBase58() ===
              'DSwfRF1jhhu6HpSuzaig1G19kzP73PfLZBPLofkw6fLD' && <StarsAlert />}
            {forumHeader}
          </div>
          <div className="toolsWrapper">
            <PermissionsGate scopes={[SCOPES.canEditForum]}>
              <div className="moderatorToolsContainer">
                <div>Owner tools: </div>
                <div className="tools">
                  <div className="lock">
                    <Lock />
                  </div>
                  <ManageOwners forumData={forumData} />
                  <ManageModerators forumData={forumData} />
                  {
                    // The manage users UI should be hidden for DAA
                    forumIdentity !== ForumIdentity.DegenerateApeAcademy && (
                      <PermissionsGate scopes={[SCOPES.canAddForumRestriction]}>
                        <button
                          className="moderatorTool"
                          disabled={!permission.readAndWrite}
                          onClick={() => setShowManageAccessToken(true)}>
                          Manage forum access
                        </button>
                      </PermissionsGate>
                    )
                  }
                  <EditForum forumData={forumData} update={update} />
                  <UploadForumBanner
                    onSetImageURL={async () => update()}
                    collectionId={forumData.collectionId}
                    currentBannerURL={forumData.images?.background ?? ''}
                  />
                </div>
              </div>
            </PermissionsGate>
          </div>
          {(() => {
            if (newTopicInFlight) {
              return <Spinner />;
            } else if (!isNil(forumData.collectionId)) {
              return (
                <div className="topicListWrapper">
                  <TopicList forumData={forumData} />
                </div>
              );
            }
          })()}
        </>
      </div>
    </div>
  );
}
