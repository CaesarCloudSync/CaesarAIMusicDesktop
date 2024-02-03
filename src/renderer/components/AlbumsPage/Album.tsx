/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Img from '../Img';
import MultipleSelectionCheckbox from '../MultipleSelectionCheckbox';
import SongArtist from '../SongsPage/SongArtist';
import DefaultAlbumCover from '../../../../assets/images/webp/album_cover_default.webp';
import Button from '../Button';

interface AlbumProp extends Album {
  // eslint-disable-next-line react/no-unused-prop-types
  index: number;
  className?: string;
  selectAllHandler?: (_upToId?: string) => void;
}

export const Album = (props: AlbumProp) => {
  const {
    currentlyActivePage,
    queue,
    isMultipleSelectionEnabled,
    multipleSelectionsData,
  } = React.useContext(AppContext);

  const {
    changeCurrentActivePage,
    createQueue,
    updateContextMenuData,
    updateQueueData,
    addNewNotifications,
    updateMultipleSelections,
    toggleMultipleSelections,
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const playAlbumSongs = React.useCallback(
    (isShuffle = false) => {
      return window.api.audioLibraryControls
        .getSongInfo(
          props.songs.map((song) => song.songId),
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
              isShuffle,
              props.albumId,
              true,
            );
          return undefined;
        });
    },
    [createQueue, props.albumId, props.songs],
  );

  const playAlbumSongsForMultipleSelections = React.useCallback(
    (isShuffle = false) => {
      const { multipleSelections: albumIds } = multipleSelectionsData;

      window.api.albumsData
        .getAlbumData(albumIds)
        .then((albums) => {
          if (Array.isArray(albums) && albums.length > 0) {
            const albumSongIds = albums
              .map((album) => album.songs.map((song) => song.songId))
              .flat();

            return window.api.audioLibraryControls.getSongInfo(
              albumSongIds,
              undefined,
              undefined,
              true,
            );
          }
          return undefined;
        })
        .then((songs) => {
          if (Array.isArray(songs))
            return createQueue(
              songs
                .filter((song) => !song.isBlacklisted)
                .map((song) => song.songId),
              'songs',
              isShuffle,
              undefined,
              true,
            );
          return undefined;
        })
        .catch((err) => console.error(err));
    },
    [createQueue, multipleSelectionsData],
  );

  const addToQueueForMultipleSelections = React.useCallback(() => {
    const { multipleSelections: albumIds } = multipleSelectionsData;
    window.api.genresData
      .getGenresData(albumIds)
      .then((albums) => {
        if (Array.isArray(albums) && albums.length > 0) {
          const albumSongIds = albums
            .map((album) => album.songs.map((song) => song.songId))
            .flat();

          return window.api.audioLibraryControls.getSongInfo(
            albumSongIds,
            undefined,
            undefined,
            true,
          );
        }
        return undefined;
      })
      .then((songs) => {
        if (Array.isArray(songs)) {
          queue.queue.push(
            ...songs
              .filter((song) => !song.isBlacklisted)
              .map((song) => song.songId),
          );
          updateQueueData(undefined, queue.queue);
          addNewNotifications([
            {
              id: 'newSongsToQueue',
              delay: 5000,
              content: t('notifications.addedToQueue', { count: songs.length }),
            },
          ]);
        }
        return undefined;
      })
      .catch((err) => console.error(err));
  }, [
    addNewNotifications,
    multipleSelectionsData,
    queue.queue,
    t,
    updateQueueData,
  ]);

  const showAlbumInfoPage = React.useCallback(
    () =>
      currentlyActivePage?.data?.albumId !== props.albumId &&
      changeCurrentActivePage('AlbumInfo', {
        albumId: props.albumId,
      }),
    [changeCurrentActivePage, currentlyActivePage?.data, props.albumId],
  );

  const isAMultipleSelection = React.useMemo(() => {
    if (!multipleSelectionsData.isEnabled) return false;
    if (multipleSelectionsData.selectionType !== 'album') return false;
    if (multipleSelectionsData.multipleSelections.length <= 0) return false;
    if (
      multipleSelectionsData.multipleSelections.some(
        (selectionId) => selectionId === props.albumId,
      )
    )
      return true;
    return false;
  }, [multipleSelectionsData, props.albumId]);

  const albumArtists = React.useMemo(() => {
    const { artists } = props;
    if (Array.isArray(artists) && artists.length > 0) {
      return artists
        .map((artist, i) => {
          const arr = [
            <SongArtist
              key={artist.artistId}
              artistId={artist.artistId}
              name={artist.name}
              className={
                isAMultipleSelection
                  ? '!text-font-color-black dark:!text-font-color-black'
                  : ''
              }
            />,
          ];

          if ((artists?.length ?? 1) - 1 !== i)
            arr.push(
              <span
                key={`${artists[i].name},${artists[i + 1].name}`}
                className="mr-1"
              >
                ,
              </span>,
            );

          return arr;
        })
        .flat();
    }
    return (
      <span className="text-xs font-normal">{t('common.unknownArtist')}</span>
    );
  }, [isAMultipleSelection, props, t]);

  const contextMenuItems: ContextMenuItem[] = React.useMemo(() => {
    const isMultipleSelectionsEnabled =
      multipleSelectionsData.selectionType === 'album' &&
      multipleSelectionsData.multipleSelections.length !== 1 &&
      isAMultipleSelection;
    return [
      {
        label: t(`common.${isMultipleSelectionsEnabled ? 'playAll' : 'play'}`),
        iconName: 'play_arrow',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled)
            playAlbumSongsForMultipleSelections();
          else playAlbumSongs();
          toggleMultipleSelections(false);
        },
      },
      {
        label: isMultipleSelectionsEnabled
          ? t(`common.shuffleAndPlayAll`)
          : t(`common.shuffleAndPlay`),
        iconName: 'shuffle',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled)
            playAlbumSongsForMultipleSelections(true);
          else playAlbumSongs(true);
          toggleMultipleSelections(false);
        },
      },
      {
        label: t(`common.addToQueue`),
        iconName: 'queue',
        handlerFunction: () => {
          if (isMultipleSelectionsEnabled) addToQueueForMultipleSelections();
          else {
            queue.queue.push(...props.songs.map((song) => song.songId));
            updateQueueData(undefined, queue.queue);
            addNewNotifications([
              {
                id: 'newSongsToQueue',
                delay: 5000,
                content: t(`notifications.addedToQueue`, {
                  count: props.songs.length,
                }),
              },
            ]);
          }
          toggleMultipleSelections(false);
        },
      },
      {
        label: 'Hr',
        isContextMenuItemSeperator: true,
        handlerFunction: null,
      },
      {
        label: t(`common.info`),
        iconName: 'info',
        handlerFunction: showAlbumInfoPage,
      },
      {
        label: t(`common.${isAMultipleSelection ? 'unselect' : 'select'}`),
        iconName: 'checklist',
        handlerFunction: () => {
          if (isMultipleSelectionEnabled) {
            return updateMultipleSelections(
              props.albumId,
              'album',
              isAMultipleSelection ? 'remove' : 'add',
            );
          }
          return toggleMultipleSelections(!isAMultipleSelection, 'album', [
            props.albumId,
          ]);
        },
      },
      // {
      //   label: 'Select/Unselect All',
      //   iconName: 'checklist',
      //   isDisabled: !props.selectAllHandler,
      //   handlerFunction: () =>
      //     props.selectAllHandler && props.selectAllHandler(),
      // },
    ];
  }, [
    addNewNotifications,
    addToQueueForMultipleSelections,
    isAMultipleSelection,
    isMultipleSelectionEnabled,
    multipleSelectionsData.multipleSelections.length,
    multipleSelectionsData.selectionType,
    playAlbumSongs,
    playAlbumSongsForMultipleSelections,
    props.albumId,
    props.songs,
    queue.queue,
    showAlbumInfoPage,
    t,
    toggleMultipleSelections,
    updateMultipleSelections,
    updateQueueData,
  ]);

  const contextMenuItemData = React.useMemo(
    (): ContextMenuAdditionalData =>
      isMultipleSelectionEnabled &&
      multipleSelectionsData.selectionType === 'album' &&
      isAMultipleSelection
        ? {
            title: t('album.selectedAlbumCount', {
              count: multipleSelectionsData.multipleSelections.length,
            }),
            artworkPath: DefaultAlbumCover,
          }
        : {
            title: props.title,
            artworkPath: props?.artworkPaths?.optimizedArtworkPath,
            subTitle: t('common.songWithCount', { count: props.songs.length }),
            subTitle2:
              props.artists?.map((artist) => artist.name).join(', ') ||
              t('common.unknownArtist'),
          },
    [
      isAMultipleSelection,
      isMultipleSelectionEnabled,
      multipleSelectionsData.multipleSelections.length,
      multipleSelectionsData.selectionType,
      props.artists,
      props?.artworkPaths?.optimizedArtworkPath,
      props.songs.length,
      props.title,
      t,
    ],
  );

  return (
    <div
      // style={{ animationDelay: `${50 * (props.index + 1)}ms` }}
      className={`album appear-from-bottom h-68 group mb-2 mr-6 flex w-48 flex-col justify-between overflow-hidden rounded-md p-4 ${
        props.className ?? ''
      } ${
        isAMultipleSelection
          ? 'bg-background-color-3 !text-font-color-black dark:bg-dark-background-color-3 dark:!text-font-color-black'
          : 'hover:bg-background-color-2/50 dark:hover:bg-dark-background-color-2/50'
      }`}
      onContextMenu={(e) =>
        updateContextMenuData(
          true,
          contextMenuItems,
          e.pageX,
          e.pageY,
          contextMenuItemData,
        )
      }
      onClick={(e) => {
        if (e.getModifierState('Shift') === true && props.selectAllHandler)
          props.selectAllHandler(props.albumId);
        else if (
          e.getModifierState('Control') === true &&
          !isMultipleSelectionEnabled
        )
          toggleMultipleSelections(!isAMultipleSelection, 'album', [
            props.albumId,
          ]);
        else if (
          isMultipleSelectionEnabled &&
          multipleSelectionsData.selectionType === 'album'
        )
          updateMultipleSelections(
            props.albumId,
            'album',
            isAMultipleSelection ? 'remove' : 'add',
          );
        else showAlbumInfoPage();
      }}
    >
      <div className="album-cover-and-play-btn-container relative h-[70%] cursor-pointer overflow-hidden">
        {isMultipleSelectionEnabled &&
        multipleSelectionsData.selectionType === 'album' ? (
          <MultipleSelectionCheckbox
            id={props.albumId}
            selectionType="album"
            className="absolute bottom-3 right-3 z-10"
          />
        ) : (
          <Button
            className="absolute bottom-[5%] right-[5%] z-[1] !m-0 !rounded-none !border-0 !p-0 !text-font-color-white opacity-0 outline-1 outline-offset-1 transition-opacity hover:!opacity-100 focus-visible:!opacity-100 focus-visible:!outline group-focus-within:opacity-75 group-hover:opacity-75"
            iconName="play_circle"
            iconClassName="!text-5xl !leading-none"
            clickHandler={(e) => {
              e.stopPropagation();
              playAlbumSongs();
            }}
          />
        )}
        <div className="album-cover-container relative h-full overflow-hidden rounded-lg before:invisible before:absolute before:h-full before:w-full before:bg-gradient-to-b before:from-[hsla(0,0%,0%,0%)] before:to-[hsla(0,0%,0%,50%)] before:opacity-0 before:transition-[visibility,opacity] before:duration-300 before:content-[''] group-focus-within:before:visible group-focus-within:before:opacity-100 group-hover:before:visible group-hover:before:opacity-100">
          <Img
            src={props.artworkPaths.artworkPath}
            fallbackSrc={DefaultAlbumCover}
            loading="lazy"
            alt="Album Cover"
            className="h-full max-h-full w-full object-cover object-center"
            enableImgFadeIns={!isMultipleSelectionEnabled}
          />
        </div>
      </div>
      <div
        className={`album-info-container mt-2 h-fit w-full pl-2 text-font-color-black dark:text-font-color-white ${
          isAMultipleSelection &&
          '!text-font-color-black dark:!text-font-color-black'
        }`}
      >
        <Button
          className={`album-title pointer !m-0 !block w-full truncate !rounded-none !border-0 !p-0 !text-left text-xl outline-1 outline-offset-1 hover:underline focus-visible:!outline ${
            isAMultipleSelection
              ? '!text-font-color-black dark:!text-font-color-black'
              : ''
          }`}
          label={props.title}
          clickHandler={showAlbumInfoPage}
        />
        {props.artists && (
          <div
            className="album-artists flex w-full truncate text-sm hover:underline"
            title={props.artists.map((artist) => artist.name).join(', ')}
          >
            {albumArtists}
          </div>
        )}
        <div className="album-no-of-songs w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs">
          {t('common.songWithCount', { count: props.songs.length })}
        </div>
      </div>
    </div>
  );
};
