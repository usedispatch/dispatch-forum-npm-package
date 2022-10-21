import { ExternalLink } from '../../assets';

type AccountInfoLinkProps = {
  href: string;
};

export function AccountInfoLink({ href }: AccountInfoLinkProps): JSX.Element { 
  return (
    <div className="accountInfo">
      <a href={href} target="_blank" rel="noreferrer">
        <ExternalLink />
      </a>
    </div>
  );
};
