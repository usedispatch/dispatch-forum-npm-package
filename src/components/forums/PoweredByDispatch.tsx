import { DispatchLogo } from "../../assets";

interface PoweredByDispatchProps {
  customStyle: string;
}
export function PoweredByDispatch(props: PoweredByDispatchProps) {
  return (
    <div className="dsp-">
      <div className="poweredByDispatch">
        <a
          href="https://twitter.com/usedispatch"
          rel="noopener noreferrer"
          target="_blank">
          <DispatchLogo customStyle={props.customStyle} />
        </a>
      </div>
    </div>
  );
}
