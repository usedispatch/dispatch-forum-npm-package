interface TransactionLinkProps {
  transaction: string;
  cluster: string;
}

export const TransactionLink = (props: TransactionLinkProps) => {
  const { transaction, cluster } = props;
  const firstFour = transaction.substring(0, 4);
  const lastFour = transaction.substring(props.transaction.length - 4);
  const displayText = `${firstFour}...${lastFour}`;
  return (
    <div className="transactionLinkContainer">
      <a
        href={`https://solscan.io/tx/${transaction}?cluster=${cluster}`}
        className="transactionLink">
        {displayText}
      </a>
    </div>
  );
};
