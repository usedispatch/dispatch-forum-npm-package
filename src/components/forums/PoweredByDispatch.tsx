import { DispatchLogo } from "../../assets";

export function PoweredByDispatch(props: any) {
  return (
    <div className="dsp-">
      <div className="poweredByDispatch">
        <a
          href="https://twitter.com/usedispatch"
          rel="noopener noreferrer"
          target="_blank">
          <div>powered by</div>
          <DispatchLogo />
        </a>
      </div>
    </div>
  );
}
