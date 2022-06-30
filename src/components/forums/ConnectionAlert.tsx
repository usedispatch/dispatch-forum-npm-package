import { Info } from "../../assets";

export function ConnectionAlert(props: any) {
  return (
    <div className="alertContainer">
      <Info />
      <div className="alertText">
        Please connect your wallet to participate!
      </div>
    </div>
  );
}
