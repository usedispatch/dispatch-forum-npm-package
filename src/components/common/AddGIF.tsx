import { Grid, SearchBar, SearchContext } from '@giphy/react-components';
import { useContext } from 'react';

interface AddGIFProps {
  onGifSelect: (gif: string) => void;
}

export function AddGIF(props: AddGIFProps): JSX.Element {
  const { onGifSelect } = props;
  const { fetchGifs, term, activeChannel } =
    useContext(SearchContext);

  return (
    <div className="gifModal">
      <SearchBar className='searchBarWrapper'/>
      <Grid
        className="gifGrid"
        key={`${term} ${activeChannel?.user.username}`}
        columns={3}
        width={350}
        fetchGifs={fetchGifs}
        noLink
        onGifClick={gif => onGifSelect(gif.images.downsized.url)}
      />
    </div>
  );
}
