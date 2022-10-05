import { Info } from '../../assets';

export function ConnectionAlert(): JSX.Element {
  return (
    <div className="alertContainer">
      <div className="alertContent">
        <Info />
        <div className="alertText">
          Connect your wallet to join the forum and be able to participate. We
          advise you have at least 0.5 SOL to participate fully. Each post costs
          about 0.002 SOL, depending on size.
        </div>
      </div>
    </div>
  );
}
