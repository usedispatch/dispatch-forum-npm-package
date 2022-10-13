import isNil from 'lodash/isNil';
import { useState, ReactNode } from 'react';
import {
  PublicKey,
  Transaction,
  Connection,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { ForumPost, WalletInterface } from '@usedispatch/client';

import {
  CollapsibleProps,
  Input,
  MessageType,
  PopUpModal,
  Spinner,
  TransactionLink,
} from '../../common';

import { SolanaLogo, Plus } from '../../../assets';
import { useForum } from '../../../contexts/DispatchProvider';
import { DisplayableToken } from '../../../utils/postbox/postboxWrapper';
import { isSuccess } from '../../../utils/loading';

enum AwardType {
  NFT = 'NFT',
  SOL = 'SOL',
}

interface TransferSOLProps {
  wallet: WalletInterface;
  posterId: PublicKey;
  collectionId: PublicKey;
  amount: number;
  connection: Connection;
}

async function transferSOL(props: TransferSOLProps): Promise<string> {
  const { posterId, amount, wallet, connection } = props;

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: posterId,
      lamports: amount * LAMPORTS_PER_SOL,
    }),
  );

  const s = await wallet.sendTransaction(tx, connection);
  return s;
}

interface GiveAwardProps {
  post: ForumPost;
  collectionId: PublicKey;
  onCancel: () => void;
  onSuccess: (notificationContent: ReactNode) => void;
  onError: (error: any) => void;
}

export function GiveAward(props: GiveAwardProps): JSX.Element {
  const { collectionId, post, onCancel, onSuccess, onError } = props;
  const Forum = useForum();

  const [loading, setLoading] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const [selectedType, setSelectedType] = useState<AwardType>(); // TODO (Ana): include both types later
  const [selectedAmount, setSelectedAmount] = useState(1.0);
  const [loadingNFT, setLoadingNFT] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<DisplayableToken>();
  const [nfts, setNFTs] = useState<DisplayableToken[]>([]);

  const attachAward = async (): Promise<void> => {
    setLoading(true);

    try {
      const tx = await transferSOL({
        wallet: Forum.wallet,
        posterId: post.poster,
        collectionId,
        amount: selectedAmount,
        connection: Forum.connection,
      });
      setLoading(false);
      onSuccess(
        <>
          Award attached successfully.
          <TransactionLink transaction={tx} />
        </>,
      );
    } catch (error: any) {
      console.log('dsp', error);
      setLoading(false);
      onError(error);
    }
  };

  const transferNFT = async (): Promise<void> => {
    setLoading(true);

    if (!isNil(selectedNFT)) {
      const tx = await Forum.transferNFTs(
        post.poster,
        selectedNFT.mint,
        Forum.wallet.sendTransaction,
      );

      if (isSuccess(tx)) {
        setLoading(false);
        onSuccess(
          <>
            NFT transferred successfully.
            <TransactionLink transaction={tx} />
          </>,
        );
      } else {
        const error = tx;
        console.log('dsp', error);
        setLoading(false);
        onError(error);
      }
    }
  };

  const getNFTsForCurrentUser = async (): Promise<void> => {
    setLoadingNFT(true);
    const nftsForUser = await Forum.getNFTMetadataForCurrentUser();
    if (isSuccess(nftsForUser)) {
      setNFTs(nftsForUser);
      setLoadingNFT(false);
    } else {
      onError(nftsForUser);
    }
  };

  const title = isNil(selectedType)
    ? 'Select type of award'
    : selectedType === AwardType.SOL
      ? 'How many SOL do you want to award?'
      : 'Select NFT';

  const content = (
    <div className="awardContent">
      {!isNil(selectedType)
        ? (
        <>
          {selectedType === AwardType.SOL && (
            <div className="amountInputContainer">
              <div className="iconContainer">
                <SolanaLogo color="black" />
              </div>
              <Input
                className="amountInput"
                type="number"
                placeholder="Insert a numeric value bigger than 0"
                value={1.0}
                min={0}
                step={0.01}
                onChange={e => setSelectedAmount(parseFloat(e))}
              />
            </div>
          )}
          {selectedType === AwardType.NFT &&
            (loadingNFT
              ? (
              <Spinner />
              )
              : (
              <div className="giftsContainer">
                <div className="giftsGrid">
                  {nfts.length === 0 && (
                    <div className="noAvailableNFT">
                      There are no available NFTs in your wallet
                    </div>
                  )}
                  {nfts.map((nft, index) => (
                    <div
                      key={index}
                      className={`giftContainer ${
                        nft.mint === selectedNFT?.mint ? 'selectedNFT' : ''
                      }`}
                      onClick={() => setSelectedNFT(nft)}
                    >
                      <img src={nft.uri.toString()} />
                      <div className="giftName">{nft.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              ))}
        </>
        )
        : (
        <div>
          You can award one of your NFTs or select a custom amount of SOL
          <div className="typeSelector">
            <button
              className="nftType"
              onClick={async () => {
                setSelectedType(AwardType.NFT);
                await getNFTsForCurrentUser();
              }}
            >
              <Plus />
              NFT
            </button>
            <button
              className="solType"
              onClick={() => setSelectedType(AwardType.SOL)}
            >
              <SolanaLogo color="white" />
              SOL
            </button>
          </div>
        </div>
        )}
    </div>
  );

  return (
    <div className="awardContainer">
      {!isNil(modalInfo) && (
        <PopUpModal
          id="give-award-info"
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
          onClose={() => setModalInfo(null)}
        />
      )}
      <PopUpModal
        id={'give-award'}
        visible
        title={title}
        body={content}
        loading={loading}
        onClose={() => onCancel()}
        okButton={
          !isNil(selectedType) &&
          (selectedType === AwardType.SOL
            ? (
            <button
              className="attachButton"
              disabled={selectedAmount <= 0}
              onClick={async () => attachAward()}
            >
              Send
            </button>
            )
            : (
            <button
              className="confirmAndAwardButton"
              disabled={isNil(selectedNFT)}
              onClick={async () => transferNFT()}
            >
              Send
            </button>
            ))
        }
      />
    </div>
  );
}
