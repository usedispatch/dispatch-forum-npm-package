import { Chevron } from '../../assets/Chevron';
import Markdown from 'markdown-to-jsx';
import { Link } from './Link';

interface BreadcrumbProps {
  navigateTo: string;
  parent: string;
}

export function Breadcrumb(props: BreadcrumbProps): JSX.Element {
  const { navigateTo, parent } = props;

  return (
    <div className="breadcrumbContainer">
      <div className="separationIcon">
        <Chevron />
      </div>
      <Link className="parent" href={navigateTo}>
        <Markdown>{parent}</Markdown>
      </Link>
    </div>
  );
}
