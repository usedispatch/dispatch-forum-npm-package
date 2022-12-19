import { useEffect, useState } from 'react';

import { Chevron } from '../../../../assets';

import { SortOptions } from './TopicList';

interface TopicsSorterProps {
  onSelect: (item: SortOptions) => void;
}

export function TopicsSorter(props: TopicsSorterProps): JSX.Element {
  const { onSelect } = props;

  const [sortBy, setSortBy] = useState<SortOptions>(SortOptions.popular);

  const [open, setIsOpen] = useState(false);

  useEffect(() => {
    onSelect(SortOptions[sortBy]);
  }, [sortBy]);

  return (
    <div className="dsp- ">
      <div className='sortWrapper'
          onClick={() => setIsOpen(!open)}
          onMouseLeave={() => setIsOpen(false)}
        >
        <div className='sort' >
          <div>{sortBy}</div>
          <Chevron direction={open ? 'up' : 'down'} />
        </div>
        <div className='sortContent'>
          <div className={`sortItemsContainer ${open ? '' : 'hide'}`}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}>
            <div className={`sortItem ${sortBy === SortOptions.popular ? 'selected' : ''}`} onClick={() => setSortBy(SortOptions.popular)}>
              {SortOptions.popular}
            </div>
            <div className={`sortItem ${sortBy === SortOptions.recent ? 'selected' : ''}`} onClick={() => setSortBy(SortOptions.recent)}>
              {SortOptions.recent}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
