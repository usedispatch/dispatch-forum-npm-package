import { useForum } from "../../contexts/DispatchProvider";

interface TransactionLinkProps {
  transaction: string;
}

export const TransactionLink = (props: TransactionLinkProps) => {
  const { transaction } = props;

  const { cluster } = useForum();

  const firstFour = transaction.substring(0, 4);
  const lastFour = transaction.substring(props.transaction.length - 4);
  const displayText = `${firstFour}...${lastFour}`;
  return (
    <div className="transactionLinkContainer">
      Transaction:
      <a
        href={`https://solscan.io/tx/${transaction}` + (cluster === 'devnet' && `?cluster=${cluster}`)}
        className="transactionLink"
        target="_blank"
      >
        {displayText}
      </a>
    </div>
  );
};
