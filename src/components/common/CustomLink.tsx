import { TwitterTweetEmbed } from 'react-twitter-embed';

interface CustomLinkProps {
  href: string;
  className?: string;
}

export default function CustomLink(props: CustomLinkProps): JSX.Element {
  const { href, className } = props;
  const postURL = new URL('', href);
  const tweetId = postURL.href.match(/(^|[^'"])(https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+))/) ?? '';
  const isTwitterLink =
    tweetId.length > 0 && postURL.hostname === 'twitter.com';
  return (
    <>
      {isTwitterLink && tweetId !== ''
        ? (
        <TwitterTweetEmbed
        options={{ height: 100, width: 600 }}
        tweetId={tweetId[4]} />
        )
        : (
        <a href={href} className={className}>
          {href}
        </a>
        )}
    </>
  );
}
