import isNil from 'lodash/isNil';
import { PublicKey } from '@solana/web3.js';
import { ForumPost } from '@usedispatch/client';
import Markdown from 'markdown-to-jsx';
import { useState, ReactNode, useEffect } from 'react';
import ReactGA from 'react-ga4';
import Lottie from 'lottie-react';

import { Chevron, Lock, Plus, Trash } from '../../../assets';
import animationData from '../../../lotties/loader.json';
import {
  CollapsibleProps,
  Input,
  MessageType,
  PopUpModal,
  TransactionLink,
  Spinner,
} from '../../common';
import {
  ConnectionAlert,
  Notification,
  CreateTopic,
  Tools,
} from '..';
import { StarsAlert } from '../StarsAlert';
import { TopicList } from './topic-list';

import { DispatchForum } from '../../../utils/postbox/postboxWrapper';
import { DispatchError, Result } from '../../../types/error';
import { isError, errorSummary } from '../../../utils/error';
import { isSuccess } from '../../../utils/loading';
import {
  ForumData,
} from '../../../utils/hooks';
import {
  restrictionListToString,
  pubkeysToRestriction,
  pubkeysToSPLRestriction,
} from '../../../utils/restrictionListHelper';
import { newPublicKey } from '../../../utils/postbox/validateNewPublicKey';
import { csvStringToPubkeyList } from '../../../utils/csvStringToPubkeyList';
import { usePath } from '../../../contexts/DispatchProvider';

interface ForumContentMobileProps {
  forumObject: DispatchForum;
  basicInfo?: { title: string; desc: string };
  forumData?: ForumData;
  update: () => Promise<void>;
}

export function ForumContentMobile(props: ForumContentMobileProps): JSX.Element {
  const { forumData, forumObject, basicInfo, update } = props;
  const { permission } = forumObject;

  if (isNil(forumData)) {
    const confirmingBox = (
      <div className="confirmingBanneMobiler">
        <div className="titleMobile">
          <div className="animationMobile">
            <Lottie loop animationData={animationData} />
          </div>
          <div className="textMobile">
            The network is confirming your forum.</div>
        </div>
        <div className="subtitleMobile">
          When it&apos;s ready, the page will reload itself. This may take a few
          seconds.
        </div>
      </div>
    );

    if (!isNil(basicInfo)) {
      const forumHeader = (
        <div className="forumContentHeaderMobile">
          <div className='titleBoxMobile'>
            <Markdown>{basicInfo.title}</Markdown>
          </div>
          <div className="descriptionBoxMobile">
            <div className="description">
              <Markdown>{basicInfo.desc}</Markdown>
            </div>
            <button className={'createTopicButtonMobile'} type="button" disabled>
              <div className="buttonImageContainer">
                <Plus />
              </div>
              Submit topic
            </button>
          </div>
        </div>
      );

      return (
        <div className="confirmingWrapperMobile">
          <>{ReactGA.send('pageview')}</>
          <div className="forumContentWrapperMobile">
            <div className="forumBanner"/>
            <div className="forumContentMobile">
              {confirmingBox}
              {!permission.readAndWrite && <ConnectionAlert />}
              <div className="forumContentSections">
                <div className='section'>
                  <TopicList update={update}/>
                </div>
                <div className='section'>
                  {forumHeader}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return <Spinner />;
    }
  } else {
    return (
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      <PopulatedForumContentMobile
        forumObject={forumObject}
        initialForumData={forumData}
        update={update}
      />
    );
  }
}

interface PopulatedForumContentMobileProps {
  forumObject: DispatchForum;
  initialForumData: ForumData;
  update: () => Promise<void>;
}

function PopulatedForumContentMobile(
  props: PopulatedForumContentMobileProps,
): JSX.Element {
  const { initialForumData, forumObject, update } = props;
  const { permission } = forumObject;
  const { buildTopicPath } = usePath();

  const [forumData, setForumData] = useState<ForumData>(initialForumData);
  useEffect(() => {
    setForumData(initialForumData);
  }, [initialForumData]);

  const onUpdateImage = async (imageUrl: string): Promise<void> => {
    const { images } = forumData;
    setForumData({ ...forumData, images: { ...images, background: imageUrl } });
    await update();
  };

  const [showDesc, setShowDesc] = useState(true);
  const [newTopicInFlight, setNewTopicInFlight] = useState<{ title: string }>();
  const [addNFTGate, setAddNFTGate] = useState(false);
  const [addSPLGate, setAddSPLGate] = useState(false);
  const [tokenGateSelection, setTokenGateSelection] = useState('');
  const [notification, setNotification] = useState<{
    isHidden: boolean;
    content?: string | ReactNode;
    type?: MessageType;
  }>({ isHidden: true });
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

  const [newForumAccessToken, setNewForumAccessToken] = useState('');
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
          collapsible: {
            header: 'Error',
            content: errorSummary(error as DispatchError),
          },
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

  useEffect(() => {
    if (!isNil(newTopicInFlight)) {
      // once topics are updated, redirect to new topic
      const topics = initialForumData.posts.filter(p => p.isTopic);
      const topicPath = buildTopicPath(
        initialForumData.collectionId.toBase58(),
        (topics[0] as ForumPost).postId,
      );
      location.assign(`${topicPath}${location.search}`);
      setNewTopicInFlight(undefined);
    }
  }, [initialForumData.posts]);

  const forumHeader = (
    <div className="forumContentHeaderMobile">
      <>
        <div className={'titleBoxMobile'}>
          {currentForumAccessToken.length > 0 && (
            <div className="gatedForumMobile">
              <Lock />
            </div>
          )}
          <Markdown>{forumData.description.title}</Markdown>
          <div
            className='descriptionVisibilityMobile'
            onClick={() => setShowDesc(!showDesc)}
          >
            <>
              About <Chevron direction={showDesc ? 'up' : 'down'}/>
            </>
          </div>
        </div>
        <div className="descriptionBoxMobile">
          <div className={`descriptionMobile ${showDesc ? '' : 'descHidden'}`}>
            <Markdown>{forumData.description.desc}</Markdown>
          </div>
          <CreateTopic
            forumObject={forumObject}
            forumData={initialForumData}
            currentForumAccessToken={currentForumAccessToken}
            topicInFlight={title => {
              if (title === '') {
                setNewTopicInFlight(undefined);
              } else {
                setNewTopicInFlight({ title });
              }
            }}
            update={update}
          />
        </div>
      </>
    </div>
  );

  useEffect(() => {
    parseCollectionList(newForumAccessToken);
  }, [newForumAccessToken]);

  useEffect(() => {
    setAddNFTGate(tokenGateSelection === 'NFT');
    setAddSPLGate(tokenGateSelection === 'SPL');
  }, [tokenGateSelection]);

  return (
    <div className="dsp- ">
      <div className="forumContentWrapperMobile">
        <div
          className="forumBanner"
          style={{
            backgroundImage:
              !isNil(forumData.images?.background) &&
              forumData.images.background.length > 0
                ? `url(${forumData.images?.background as string})`
                : undefined,
          }}
        />
        <>
          {ReactGA.send('pageview')}
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
                      {currentForumAccessToken.length === 0 && (
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
          {removeAccessToken.show &&
            !isNil(removeAccessToken.token) &&
            isNil(modalInfo) && (
              <PopUpModal
                id="remove-access-token"
                visible
                title="Are you sure you want to remove NFT Collection ID?"
                body={
                  <div>
                    This action will remove the token
                    {` ${removeAccessToken.token.substring(0, 4)}...`}
                    {`${removeAccessToken.token.slice(-4)} `} from gating the
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
          <div className="forumContentMobile">
            <Notification
              hidden={notification.isHidden}
              content={notification?.content}
              type={notification?.type}
              onClose={() => setNotification({ isHidden: true })}
            />
            {!permission.readAndWrite && <ConnectionAlert />}
            {forumData.collectionId.toBase58() ===
              'DSwfRF1jhhu6HpSuzaig1G19kzP73PfLZBPLofkw6fLD' && <StarsAlert />}
            <div className='forumActionsMobile'>
              {permission.readAndWrite &&
                <Tools
                  forumData={forumData}
                  onUpdateBanner={onUpdateImage}
                  onShowManageAccess={() => setShowManageAccessToken(true)}
                  update={update}
                />
              }
            </div>
            <div className="forumContentSections">
              <div className="section">
                {forumHeader}
              </div>
              <div className="section">
                {!isNil(forumData.collectionId) && (
                  <div className="topicListWrapperMobile">
                    <TopicList
                      forumData={forumData}
                      update={update}
                      topicInFlight={newTopicInFlight}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}
