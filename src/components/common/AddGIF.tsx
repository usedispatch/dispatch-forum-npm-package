import { Grid, SearchBar, SearchContext } from '@giphy/react-components';
import { useContext } from 'react';
import { GIPHY_ATTRIBUTION } from '../../utils/consts';

interface AddGIFProps {
  onGifSelect: (gif: string) => void;
}

export function AddGIF(props: AddGIFProps): JSX.Element {
  const { onGifSelect } = props;
  const { fetchGifs, term } =
    useContext(SearchContext);

  return (
    <div className="gifModal">
      <SearchBar className='searchBarWrapper'/>
      <img src={GIPHY_ATTRIBUTION} alt="Powered by GIPHY" className="poweredByGiphy" />
      <Grid
        className="gifGrid"
        key={`${term}`}
        columns={3}
        width={350}
        fetchGifs={fetchGifs}
        noLink
        onGifClick={gif => onGifSelect(gif.images.downsized.url)}
      />
    </div>
  );
}
