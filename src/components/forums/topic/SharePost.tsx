import { Chain } from '../../../assets';

type SharePostProps = {
  postAddress: string;
};

const SharePost = ({ postAddress }: SharePostProps) => {
  const handleClick = () => {
    navigator.clipboard.writeText(`${window.location.href}#${postAddress}`);
  };

  return (
    <button type="button" onClick={handleClick}>
      <a href={`#${postAddress}`}>
        <Chain />
      </a>
    </button>
  );
};

export { SharePost };
