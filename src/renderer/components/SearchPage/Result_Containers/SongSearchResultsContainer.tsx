import React from 'react';
import Button from 'renderer/components/Button';
import SecondaryContainer from 'renderer/components/SecondaryContainer';
import Song from 'renderer/components/SongsPage/Song';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import { useTranslation } from 'react-i18next';

type Props = {
  songs: SongData[];
  searchInput: string;
  noOfVisibleSongs?: number;
  isPredictiveSearchEnabled: boolean;
};

const SongSearchResultsContainer = (props: Props) => {
  const {
    searchInput,
    songs,
    noOfVisibleSongs = 5,
    isPredictiveSearchEnabled,
  } = props;
  const {
    isMultipleSelectionEnabled,
    multipleSelectionsData,
    localStorageData,
  } = React.useContext(AppContext);
  const {
    toggleMultipleSelections,
    changeCurrentActivePage,
    createQueue,
    playSong,
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const handleSongPlayBtnClick = React.useCallback(
    (currSongId: string) => {
      const queueSongIds = songs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);
      createQueue(queueSongIds, 'songs', false, undefined, false);
      playSong(currSongId, true);
    },
    [createQueue, playSong, songs],
  );

  const songResults = React.useMemo(
    () =>
      songs.length > 0
        ? songs
            .map((song, index) => {
              if (index < noOfVisibleSongs)
                return (
                  <Song
                    key={song.songId}
                    index={index}
                    isIndexingSongs={
                      localStorageData?.preferences?.isSongIndexingEnabled
                    }
                    title={song.title}
                    artists={song.artists}
                    album={song.album}
                    artworkPaths={song.artworkPaths}
                    duration={song.duration}
                    songId={song.songId}
                    path={song.path}
                    isAFavorite={song.isAFavorite}
                    year={song.year}
                    isBlacklisted={song.isBlacklisted}
                    onPlayClick={handleSongPlayBtnClick}
                  />
                );
              return undefined;
            })
            .filter((song) => song !== undefined)
        : [],
    [
      handleSongPlayBtnClick,
      localStorageData?.preferences?.isSongIndexingEnabled,
      noOfVisibleSongs,
      songs,
    ],
  );

  return (
    <SecondaryContainer
      className={`secondary-container songs-list-container ${
        songResults.length > 0 ? 'active relative mt-8' : 'absolute mt-4'
      }`}
    >
      <>
        <div
          className={`title-container mb-8 mt-1 flex items-center pr-4 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight ${
            songResults.length > 0
              ? 'visible opacity-100'
              : 'invisible opacity-0'
          }`}
        >
          <div className="container flex">
            Songs{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs">
              {songs && songs.length > 0 && (
                <span className="no-of-songs">
                  {t(
                    `searchPage.${
                      songs.length > noOfVisibleSongs
                        ? 'resultAndVisibleCount'
                        : 'resultCount'
                    }`,
                    { count: songs.length, noVisible: noOfVisibleSongs },
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="other-controls-container flex">
            <Button
              label={t(
                `common.${
                  isMultipleSelectionEnabled &&
                  multipleSelectionsData.selectionType === 'songs'
                    ? 'unselectAll'
                    : 'select'
                }`,
              )}
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={
                isMultipleSelectionEnabled &&
                multipleSelectionsData.selectionType === 'songs'
                  ? 'remove_done'
                  : 'checklist'
              }
              clickHandler={() =>
                toggleMultipleSelections(!isMultipleSelectionEnabled, 'songs')
              }
              isDisabled={
                isMultipleSelectionEnabled &&
                multipleSelectionsData.selectionType !== 'songs'
              }
              tooltipLabel={t(
                `common.${
                  isMultipleSelectionEnabled ? 'unselectAll' : 'select'
                }`,
              )}
            />
            {songs.length > noOfVisibleSongs && (
              <Button
                label={t('common.showAll')}
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  changeCurrentActivePage('AllSearchResults', {
                    searchQuery: searchInput,
                    searchFilter: 'Songs' as SearchFilters,
                    searchResults: songs,
                    isPredictiveSearchEnabled,
                  })
                }
              />
            )}
          </div>
        </div>
        <div
          className={`songs-container mb-12 ${
            songResults.length > 0
              ? 'visible translate-y-0 opacity-100'
              : 'invisible translate-y-8 opacity-0 transition-transform'
          }`}
        >
          {songResults}
        </div>
      </>
    </SecondaryContainer>
  );
};

export default SongSearchResultsContainer;
