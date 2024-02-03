import React from 'react';
import { useTranslation } from 'react-i18next';
import Img from 'renderer/components/Img';
import SecondaryContainer from 'renderer/components/SecondaryContainer';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import { MostRelevantResult } from '../MostRelevantResult';

type Props = { searchResults: SearchResult };

const MostRelevantSearchResultsContainer = (props: Props) => {
  const { searchResults } = props;
  const { currentSongData, queue } = React.useContext(AppContext);
  const { t } = useTranslation();

  const {
    playSong,
    changeCurrentActivePage,
    updateQueueData,
    createQueue,
    addNewNotifications,
  } = React.useContext(AppUpdateContext);

  const MostRelevantResults = [];

  const [isOverScrolling, setIsOverScrolling] = React.useState(true);
  const mostRelevantResultContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const { albums, artists, genres, playlists, songs } = searchResults;
    const totalResults =
      albums.length +
      artists.length +
      genres.length +
      playlists.length +
      songs.length;

    if (totalResults > 0 && mostRelevantResultContainerRef.current) {
      const { scrollWidth, clientWidth } =
        mostRelevantResultContainerRef.current;

      console.log({ scrollWidth, clientWidth });
      const isScrollable = scrollWidth > clientWidth;

      setIsOverScrolling(isScrollable);
    }
  }, [searchResults]);

  if (searchResults.songs.length > 0) {
    const firstResult = searchResults.songs[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="song"
        title={firstResult.title}
        key={0}
        id={firstResult.songId}
        artworkPaths={firstResult.artworkPaths}
        infoType1={
          firstResult.artists
            ? firstResult.artists.map((artist) => artist.name).join(',')
            : t('common.unknownArtist')
        }
        infoType2={
          firstResult.album ? firstResult.album.name : t('common.unknownAlbum')
        }
        contextMenuItems={[
          {
            label: t('common.play'),
            handlerFunction: () => playSong(firstResult.songId),
            iconName: 'play_arrow',
          },
          {
            label: t('common.playNext'),
            iconName: 'shortcut',
            handlerFunction: () => {
              const newQueue = queue.queue.filter(
                (id) => id !== firstResult.songId,
              );
              const duplicateSongIndex = queue.queue.indexOf(
                firstResult.songId,
              );

              const currentSongIndex =
                queue.currentSongIndex &&
                duplicateSongIndex !== -1 &&
                duplicateSongIndex < queue.currentSongIndex
                  ? queue.currentSongIndex - 1
                  : undefined;

              newQueue.splice(
                newQueue.indexOf(currentSongData.songId) + 1 || 0,
                0,
                firstResult.songId,
              );
              updateQueueData(currentSongIndex, newQueue, undefined, false);
              addNewNotifications([
                {
                  id: `${firstResult.title}PlayNext`,
                  delay: 5000,
                  content: (
                    <span>
                      {t('notifications.playingNext', {
                        title: firstResult.title,
                      })}
                    </span>
                  ),
                  icon: <span className="material-icons-round">shortcut</span>,
                },
              ]);
            },
          },
          {
            label: t('common.addToQueue'),
            iconName: 'queue',
            handlerFunction: () => {
              updateQueueData(undefined, [...queue.queue, firstResult.songId]);
              addNewNotifications(
                [
                  {
                    id: `${firstResult.title}AddedToQueue`,
                    delay: 5000,
                    content: (
                      <span>
                        {t('notifications.addedToQueue', { count: 1 })}
                      </span>
                    ),
                    icon: (
                      <Img
                        src={firstResult.artworkPaths?.artworkPath}
                        alt={t('song.artwork')}
                        loading="eager"
                      />
                    ),
                  },
                ],
                // <span className="material-icons-round icon">playlist_add</span>
              );
            },
          },
          {
            label: t('song.revealInFileExplorer'),
            class: 'reveal-file-explorer',
            iconName: 'folder_open',
            handlerFunction: () =>
              window.api.songUpdates.revealSongInFileExplorer(
                firstResult.songId,
              ),
          },
          {
            label: t('common.info'),
            class: 'info',
            iconName: 'info',
            handlerFunction: () =>
              changeCurrentActivePage('SongInfo', {
                songId: firstResult.songId,
              }),
          },
        ]}
      />,
    );
  }

  if (searchResults.artists.length > 0) {
    const firstResult = searchResults.artists[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="artist"
        title={firstResult.name}
        key={1}
        id={firstResult.artistId}
        artworkPaths={firstResult.artworkPaths}
        onlineArtworkPath={
          firstResult.onlineArtworkPaths
            ? firstResult.onlineArtworkPaths.picture_medium
            : undefined
        }
        infoType1={t('common.songWithCount', {
          count: firstResult.songs.length,
        })}
        contextMenuItems={[
          {
            label: t('artist.playAllSongs'),
            iconName: 'play_arrow',
            handlerFunction: () =>
              window.api.audioLibraryControls
                .getSongInfo(
                  firstResult.songs.map((song) => song.songId),
                  undefined,
                  undefined,
                  true,
                )
                .then((songs) => {
                  if (Array.isArray(songs))
                    return createQueue(
                      songs
                        .filter((song) => !song.isBlacklisted)
                        .map((song) => song.songId),
                      'artist',
                      false,
                      firstResult.artistId,
                      true,
                    );
                  return undefined;
                }),
          },
          {
            label: t('common.info'),
            iconName: 'info',
            handlerFunction: () =>
              changeCurrentActivePage('ArtistInfo', {
                artistName: firstResult.name,
                artistId: firstResult.artistId,
              }),
          },
          {
            label: t('common.addToQueue'),
            iconName: 'queue',
            handlerFunction: () => {
              updateQueueData(undefined, [
                ...queue.queue,
                ...firstResult.songs.map((song) => song.songId),
              ]);
              addNewNotifications([
                {
                  id: `${firstResult.name}AddedToQueue`,
                  delay: 5000,
                  content: (
                    <span>
                      {t('notifications.addedToQueue', {
                        count: firstResult.songs.length,
                      })}
                    </span>
                  ),
                },
              ]);
            },
          },
        ]}
      />,
    );
  }

  if (searchResults.albums.length > 0) {
    const firstResult = searchResults.albums[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="album"
        title={firstResult.title}
        key={2}
        id={firstResult.albumId}
        artworkPaths={firstResult.artworkPaths}
        infoType1={
          firstResult.artists
            ? firstResult.artists.map((artist) => artist.name).join(',')
            : t('common.unknownArtist')
        }
        infoType2={t('common.songWithCount', {
          count: firstResult.songs.length,
        })}
        contextMenuItems={[
          {
            label: t('common.play'),
            iconName: 'play_arrow',
            handlerFunction: () =>
              window.api.audioLibraryControls
                .getSongInfo(
                  firstResult.songs.map((song) => song.songId),
                  undefined,
                  undefined,
                  true,
                )
                .then((songs) => {
                  if (Array.isArray(songs))
                    return createQueue(
                      songs
                        .filter((song) => !song.isBlacklisted)
                        .map((song) => song.songId),
                      'album',
                      false,
                      firstResult.albumId,
                      true,
                    );
                  return undefined;
                }),
          },
          {
            label: t('common.addToQueue'),
            iconName: 'queue',
            handlerFunction: () => {
              queue.queue.push(...firstResult.songs.map((song) => song.songId));
              updateQueueData(undefined, queue.queue, false);
              addNewNotifications([
                {
                  id: 'addedToQueue',
                  delay: 5000,
                  content: (
                    <span>
                      {t('notifications.addedToQueue', {
                        count: firstResult.songs.length,
                      })}
                    </span>
                  ),
                },
              ]);
            },
          },
        ]}
      />,
    );
  }

  if (searchResults.playlists.length > 0) {
    const firstResult = searchResults.playlists[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="playlist"
        title={firstResult.name}
        key={3}
        id={firstResult.playlistId}
        artworkPaths={firstResult.artworkPaths}
        infoType1={t('common.songWithCount', {
          count: firstResult.songs.length,
        })}
        contextMenuItems={[
          {
            label: t('common.play'),
            iconName: 'play_arrow',
            handlerFunction: () =>
              window.api.audioLibraryControls
                .getSongInfo(firstResult.songs, undefined, undefined, true)
                .then((songs) => {
                  if (Array.isArray(songs))
                    return createQueue(
                      songs
                        .filter((song) => !song.isBlacklisted)
                        .map((song) => song.songId),
                      'playlist',
                      false,
                      firstResult.playlistId,
                      true,
                    );
                  return undefined;
                }),
          },
        ]}
      />,
    );
  }

  if (searchResults.genres.length > 0) {
    const firstResult = searchResults.genres[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="genre"
        title={firstResult.name}
        key={4}
        id={firstResult.genreId}
        artworkPaths={firstResult.artworkPaths}
        infoType1={t('common.songWithCount', {
          count: firstResult.songs.length,
        })}
        contextMenuItems={[
          {
            label: t('common.play'),
            iconName: 'play_arrow',
            handlerFunction: () =>
              window.api.audioLibraryControls
                .getSongInfo(
                  firstResult.songs.map((song) => song.songId),
                  undefined,
                  undefined,
                  true,
                )
                .then((songs) => {
                  if (Array.isArray(songs))
                    return createQueue(
                      songs
                        .filter((song) => !song.isBlacklisted)
                        .map((song) => song.songId),
                      'playlist',
                      false,
                      firstResult.genreId,
                      true,
                    );
                  return undefined;
                }),
          },
        ]}
      />,
    );
  }

  return (
    <SecondaryContainer
      className={`most-relevant-results-container mt-4 ${
        MostRelevantResults.length > 0
          ? 'active visible relative'
          : 'invisible absolute'
      }`}
    >
      <>
        <div className="title-container mb-8 mt-1 flex items-center pr-4 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          {t('searchPage.mostRelevant')}
        </div>
        <div
          className={`results-container overflow-x-auto ${
            isOverScrolling ? 'overscroll-contain' : 'overscroll-auto'
          } transition-[transform,opacity] ${
            MostRelevantResults.length > 0
              ? 'visible flex translate-y-0 pb-4 opacity-100 [&>div.active]:flex [&>div]:hidden'
              : 'tranlate-y-8 invisible opacity-0'
          }`}
          ref={mostRelevantResultContainerRef}
          onWheel={(e) => {
            if (mostRelevantResultContainerRef.current) {
              e.stopPropagation();
              mostRelevantResultContainerRef.current.scrollLeft += e.deltaY;
            }
          }}
        >
          {MostRelevantResults}
        </div>
      </>
    </SecondaryContainer>
  );
};

export default MostRelevantSearchResultsContainer;
