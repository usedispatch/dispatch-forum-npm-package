import { Chevron } from '../../assets/Chevron';
import Markdown from 'markdown-to-jsx';
import { Link } from './Link';

interface BreadcrumbProps {
  navigateTo: string;
  parent: string;
  current: string;
}

export function Breadcrumb(props: BreadcrumbProps): JSX.Element {
  const { navigateTo, current, parent } = props;

  return (
    <div className="breadcrumbContainer">
      <Link className="parent" href={navigateTo}>
        <Markdown>{parent}</Markdown>
      </Link>
      <div className="separationIcon">
        <Chevron />
      </div>
      <div className="current">
        <Markdown>{current}</Markdown>
      </div>
    </div>
  );
}
