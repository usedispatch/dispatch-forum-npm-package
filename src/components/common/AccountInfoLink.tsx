import { ExternalLink } from '../../assets';

type AccountInfoLinkProps = {
  href: string;
};

const AccountInfoLink = ({ href }: AccountInfoLinkProps): JSX.Element => (
  <div className="accountInfo">
    <a href={href} target="_blank" rel="noreferrer">
      <ExternalLink />
    </a>
  </div>
);

export { AccountInfoLink };
