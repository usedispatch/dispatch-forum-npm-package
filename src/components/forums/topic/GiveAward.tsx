import * as _ from "lodash";
import { useState, ReactNode, useMemo } from "react";
import * as web3 from "@solana/web3.js";

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
  postId: number;
  collectionId: web3.PublicKey;
  onCancel: () => void;
  onSuccess: (notificationContent: ReactNode) => void;
  onError: (error: any) => void;
}

export function GiveAward(props: GiveAwardProps) {
  const { collectionId, postId, onCancel, onSuccess, onError } = props;
  const Forum = useForum();
  const permission = Forum.permission;

  const [loading, setLoading] = useState(false);

  const [modalInfo, setModalInfo] = useState<{
    title: string | ReactNode;
    type: MessageType;
    body?: string;
    collapsible?: CollapsibleProps;
  } | null>(null);

  const [selectedType, setSelectedType] = useState<AwardType>();
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [selectedNFT, setSelectedNFT] = useState<any>();

  const attachAward = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setLoading(true);
    const amount = event.target;

    try {
      const tx = "funca";
      setLoading(false);
      onSuccess(
        <>
          <Success />
          Award attached successfully.
          <TransactionLink transaction={tx!} />
        </>
      );
    } catch (error: any) {
      setLoading(false);
      onError(error);
    }
  };

  const title = selectedType
    ? selectedType === AwardType.SOL
      ? "How many SOL do you want to award?"
      : "Awards"
    : "Select type of award";

  const nfts = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
          {selectedType === AwardType.NFT && (
            <div className="giftsContainer">
              <div className="giftsGrid">
                {nfts.map((value, index) => (
                  <div
                    key={index}
                    className="giftContainer"
                    onClick={() => setSelectedNFT(value)}>
                    <div>nft {value}</div>
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
              onClick={() => setSelectedType(AwardType.NFT)}>
              <Plus />
              NFT
            </button>
            <button
              className="solType"
              onClick={() => setSelectedType(AwardType.SOL)}>
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
              onClick={(e) => attachAward(e)}>
              Attach
            </button>
          ) : (
            <button
              className="confirmAndAwardButton"
              disabled={_.isNil(selectedNFT)}
              onClick={() => console.log("confirm and award")}>
              Confirm and award
            </button>
          ))
        }
      />
    </div>
  );
}
