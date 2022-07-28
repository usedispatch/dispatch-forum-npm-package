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
  NFT,
  SOL,
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

  const content = (
    <div className="awardContainer">
      <div className="awardContent">
        {selectedType ? (
          selectedType === AwardType.SOL ? (
            <form onSubmit={attachAward}>
              <div className="inputContainer">
                <div className="iconContainer">
                  <SolanaLogo color="black" />
                </div>
                <input
                  name="award"
                  className="amountInput"
                  placeholder="Insert a numeric value bigger than 0"
                  required
                  disabled={!permission.readAndWrite}
                />
              </div>
              <div className="attachButtonContainer">
                <button className="attachButton" type="submit">
                  Attach
                </button>
              </div>
            </form>
          ) : (
            <div>nfts</div>
          )
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
    </div>
  );

  return (
    <>
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
      />
    </>
  );
}
