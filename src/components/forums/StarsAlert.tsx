import { Info } from '../../assets';
// only for DAA
export function StarsAlert(): JSX.Element {
  return (
    <div className="starsAlert">
      <div className="alertContainer">
        <div className="alertContent">
          <Info />
          <div className="alertText">
            Please note: Official Degenerate Gold Star Voucher NFTs will be
            minted by Degen9nCBXi84Mw88qAW4YWLZ1azni4AcvDcax1LgTxH and given
            value using the Degenerate Star Program
            (StarLA9YsjQc6P21ALscSkXKE7mqUGsjfhCGBwmJPfS). Official Vouchers do
            not have any links in the metadata. Stay safe Degens—don&apos;t
            click any random links you aren&apos;t sure about!
          </div>
        </div>
      </div>
    </div>
  );
}
