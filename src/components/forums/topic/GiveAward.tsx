import * as _ from "lodash";
import { useState, ReactNode } from "react";
import * as web3 from "@solana/web3.js";
import { ForumPost, WalletAdapterInterface } from "@usedispatch/client";

import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  Spinner,
  TransactionLink,
} from "../../common";

import { SolanaLogo, Plus } from "../../../assets";
import { useForum } from "../../../contexts/DispatchProvider";
import { DisplayableToken } from "../../../utils/postbox/postboxWrapper";

enum AwardType {
  NFT = "NFT",
  SOL = "SOL",
}

interface GiveAwardProps {
  post: ForumPost;
  collectionId: web3.PublicKey;
  onCancel: () => void;
  onSuccess: (notificationContent: ReactNode) => void;
  onError: (error: any) => void;
}

export function GiveAward(props: GiveAwardProps) {
  const { collectionId, post, onCancel, onSuccess, onError } = props;
  const Forum = useForum();
  const permission = Forum.permission;

  const [loading, setLoading] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const [selectedType, setSelectedType] = useState<AwardType>(); // TODO (Ana): include both types later
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [loadingNFT, setLoadingNFT] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<DisplayableToken>();
  const [nfts, setNFTs] = useState<DisplayableToken[]>([]);

  const attachAward = async () => {
    setLoading(true);

    try {
      const tx = await transferSOL({
        wallet: Forum.wallet,
        posterId: post.poster,
        collectionId: collectionId,
        amount: selectedAmount,
        connection: Forum.connection,
      });
      setLoading(false);
      onSuccess(
        <>
          Award attached successfully.
          <TransactionLink transaction={tx} />
        </>
      );
    } catch (error: any) {
      console.log(error);
      setLoading(false);
      onError(error);
    }
  };

  const transferNFT = async () => {
    setLoading(true);

    try {
      const tx = await Forum.transferNFTs(
        post.poster,
        selectedNFT?.mint!,
        Forum.wallet.sendTransaction
      );

      setLoading(false);
      onSuccess(
        <>
          NFT transferred successfully.
          <TransactionLink transaction={tx} />
        </>
      );
    } catch (error: any) {
      console.log(error);
      setLoading(false);
      onError(error);
    }
  };

  const title = selectedType
    ? selectedType === AwardType.SOL
      ? "How many SOL do you want to award?"
      : "Select NFT"
    : "Select type of award";

  const content = (
    <div className="awardContent">
      {selectedType ? (
        <>
          {selectedType === AwardType.SOL && (
            <div className="amountInputContainer">
              <div className="iconContainer">
                <SolanaLogo color="black" />
              </div>
              <input
                name="award"
                className="amountInput"
                type="number"
                value={selectedAmount}
                placeholder="Insert a numeric value bigger than 0"
                onChange={(e) => setSelectedAmount(Number(e.target.value))}
                disabled={!permission.readAndWrite}
              />
            </div>
          )}
          {selectedType === AwardType.NFT &&
            (loadingNFT ? (
              <Spinner />
            ) : (
              <div className="giftsContainer">
                <div className="giftsGrid">
                  {nfts.map((nft, index) => (
                    <div
                      key={index}
                      className={`giftContainer ${
                        nft.mint === selectedNFT?.mint ? "selectedNFT" : ""
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
      ) : (
        <div>
          You can award one of your NFTs or select a custom amount of SOL
          <div className="typeSelector">
            <button
              className="nftType"
              onClick={() => {
                setSelectedType(AwardType.NFT);
                getNFTsForCurrentUser();
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

  const getNFTsForCurrentUser = async () => {
    try {
      setLoadingNFT(true);
      const nfts = await Forum.getNFTMetadataForCurrentUser();
      setNFTs(nfts);
      setLoadingNFT(false);
    } catch (error: any) {
      onError(error);
    }
  };

  return (
    <div className="awardContainer">
      {!_.isNil(modalInfo) && (
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
        />
      )}
      <PopUpModal
        id={"give-award"}
        visible
        title={title}
        body={content}
        loading={loading}
        onClose={() => onCancel()}
        okButton={
          selectedType &&
          (selectedType === AwardType.SOL ? (
            <button
              className="attachButton"
              disabled={selectedAmount === 0}
              onClick={() => attachAward()}
            >
              Send
            </button>
          ) : (
            <button
              className="confirmAndAwardButton"
              disabled={_.isNil(selectedNFT)}
              onClick={() => transferNFT()}
            >
              Send
            </button>
          ))
        }
      />
    </div>
  );
}

interface TransferSOLProps {
  wallet: WalletAdapterInterface;
  posterId: web3.PublicKey;
  collectionId: web3.PublicKey;
  amount: number;
  connection: web3.Connection;
}

async function transferSOL(props: TransferSOLProps) {
  const { posterId, amount, wallet, connection } = props;

  let tx = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: wallet.publicKey!,
      toPubkey: posterId,
      lamports: amount * web3.LAMPORTS_PER_SOL,
    })
  );

  const s = await wallet.sendTransaction(tx, connection);
  return s;
}
