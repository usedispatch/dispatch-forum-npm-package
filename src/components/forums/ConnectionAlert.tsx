import { Info } from "../../assets";

export function ConnectionAlert(props: any) {
  return (
    <div className="alertContainer">
      <Info />
      <div className="alertText">
        Connect your wallet to join the forum and be able to participate.
      </div>
    </div>
  );
}
