import { DispatchLogo } from '../../assets';

import { useTheme } from '../../contexts/DispatchProvider';

interface PoweredByDispatchProps {
  customStyle: string;
}

export function PoweredByDispatch(props: PoweredByDispatchProps): JSX.Element {
  const theme = useTheme();

  return (
    <div className="dsp-">
      <div className="poweredByDispatch">
        <a
          href="https://www.dispatch.forum"
          rel="noopener noreferrer"
          target="_blank">
          <DispatchLogo customStyle={props.customStyle} mode={theme.mode} />
        </a>
      </div>
    </div>
  );
}
