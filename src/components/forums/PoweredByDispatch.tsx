import { DispatchLogo } from "../../assets";

export function PoweredByDispatch(props: any) {
  return (
    <div className="poweredByDispatch">
      <a
        onClick={() =>
          window.open(`https://twitter.com/usedispatch`, "_blank")
        }>
        <div>powered by</div>
        <DispatchLogo />
      </a>
    </div>
  );
}
