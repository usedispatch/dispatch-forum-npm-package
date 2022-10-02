import { DispatchLogo } from '../../assets';

interface PoweredByDispatchProps {
  customStyle: string;
}
export function PoweredByDispatch(props: PoweredByDispatchProps): JSX.Element {
  return (
    <div className="dsp-">
      <div className="poweredByDispatch">
        <a
          href="https://www.dispatch.forum"
          rel="noopener noreferrer"
          target="_blank">
          <DispatchLogo customStyle={props.customStyle} />
        </a>
      </div>
    </div>
  );
}
