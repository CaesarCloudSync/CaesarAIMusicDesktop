import { getArtistsData } from '../filesystem';
import { getArtistArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortArtists from '../utils/sortArtists';

const fetchArtistData = async (
  artistIdsOrNames: string[] = [],
  sortType?: ArtistSortTypes,
  limit = 0,
): Promise<Artist[]> => {
  if (artistIdsOrNames) {
    log(
      `Requested artists data for ${artistIdsOrNames.length} ids ${
        sortType ? `with ${sortType}` : 'without'
      } sorting.`,
      { sortType, limit },
    );
    const artists = getArtistsData();
    if (artists.length > 0) {
      let results: SavableArtist[] = [];
      if (artistIdsOrNames.length === 0) results = artists;
      else {
        for (let x = 0; x < artistIdsOrNames.length; x += 1) {
          for (let y = 0; y < artists.length; y += 1) {
            if (
              artistIdsOrNames[x] === artists[y].artistId ||
              artistIdsOrNames[x] === artists[y].name
            )
              results.push(artists[y]);
          }
        }
      }

      if (sortType) sortArtists(results, sortType);

      const maxResults = limit || results.length;

      return results
        .filter((_, index) => index < maxResults)
        .map((x) => ({
          ...x,
          artworkPaths: getArtistArtworkPath(x.artworkName),
        }));
    }
  }
  return [];
};

export default fetchArtistData;
