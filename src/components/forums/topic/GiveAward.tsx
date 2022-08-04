import {isNil} from "../../../utils/misc";

import { useState, ReactNode } from "react";
import * as web3 from "@solana/web3.js";
import { ForumPost, WalletInterface } from "@usedispatch/client";

import {
  CollapsibleProps,
  MessageType,
  PopUpModal,
  TransactionLink,
} from "../../common";

import { Success, SolanaLogo, Plus } from "../../../assets";
import { useForum } from "../../../contexts/DispatchProvider";

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
  const [selectedNFT, setSelectedNFT] = useState<string>();
  const [nfts, setNFTs] = useState<string[]>([]); // [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const attachAward = async () => {
    setLoading(true);

    try {
      const tx = await transferSOL({
        wallet: Forum.wallet,
        posterId: post.poster,
        collectionId: collectionId,
        amount: selectedAmount,
      });
      setLoading(false);
      onSuccess(
        <>
          <Success />
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
      // TODO (Ana - Andrew): change this ugly line -- "Update wallet interface to support WalletContextState" on Notion
      let w = Forum.wallet; //as WalletContextState;

      const tx = await Forum.transferNFTs(
        post.poster,
        selectedNFT!,
        // @ts-ignore
        w.sendTransaction
      );

      setLoading(false);
      onSuccess(
        <>
          <Success />
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
      : "Awards"
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
          {selectedType === AwardType.NFT && nfts && (
            <div className="giftsContainer">
              <div className="giftsGrid">
                {nfts.map((value, index) => (
                  <div
                    key={index}
                    className={`giftContainer ${
                      value === selectedNFT ? "selectedNFT" : ""
                    }`}
                    onClick={() => setSelectedNFT(value)}
                  >
                    <div>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
      const nfts = await Forum.getNFTsForCurrentUser();
      setNFTs(nfts.map((n) => n.toBase58()));
    } catch (error: any) {
      onError(error);
    }
  };

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
              Attach
            </button>
          ) : (
            <button
              className="confirmAndAwardButton"
              disabled={isNil(selectedNFT)}
              onClick={() => transferNFT()}
            >
              Confirm and award
            </button>
          ))
        }
      />
    </div>
  );
}

interface TransferSOLProps {
  wallet: WalletInterface;
  posterId: web3.PublicKey;
  collectionId: web3.PublicKey;
  amount: number;
}

async function transferSOL(props: TransferSOLProps) {
  const { posterId, amount, wallet } = props;
  const connection = new web3.Connection("https://api.devnet.solana.com");

  let tx = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: wallet.publicKey!,
      toPubkey: posterId,
      lamports: amount * web3.LAMPORTS_PER_SOL,
    })
  );

  // TODO (Ana - Andrew): change this ugly line
  let w = wallet; //as WalletContextState;
  // @ts-ignore

  const s = await w.sendTransaction(tx, connection);

  return s;
}
