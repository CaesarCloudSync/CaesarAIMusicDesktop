/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import storage from 'renderer/utils/localStorage';

import Button from '../Button';
import Checkbox from '../Checkbox';
import { separateArtistsRegex } from '../ArtistInfoPage/SeparateArtistsSuggestion';

type Props = {
  songTitle?: string;
  songId?: string;
  artistNames: string[];
  path: string;
  updateSongInfo: (callback: (prevData: SongData) => SongData) => void;
};
const featArtistsRegex = /\(? ?feat.? (?<featArtists>[^\n\t()]+)\)?/gm;

const SongsWithFeaturingArtistsSuggestion = (props: Props) => {
  const { bodyBackgroundImage, currentSongData } = React.useContext(AppContext);
  const {
    addNewNotifications,
    changeCurrentActivePage,
    updateCurrentSongData,
  } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const {
    songTitle = '',
    songId = '',
    artistNames,
    path,
    updateSongInfo,
  } = props;

  const [isIgnored, setIsIgnored] = React.useState(false);
  const [isRemovingFeatInfoFromTitle, setIsRemovingFeatInfoFromTitle] =
    React.useState(true);
  const [isMessageVisible, setIsMessageVisible] = React.useState(true);
  const [separatedFeatArtistsNames, setSeparatedFeatArtistsNames] =
    React.useState<string[]>([]);

  const ignoredSongs = React.useMemo(
    () => storage.ignoredSongsWithFeatArtists.getIgnoredSongsWithFeatArtists(),
    [],
  );

  React.useEffect(() => {
    if (isIgnored === false && ignoredSongs.length > 0)
      setIsIgnored(ignoredSongs.includes(songId));
  }, [songId, ignoredSongs, songTitle, isIgnored]);

  React.useEffect(() => {
    const featArtistsExec = featArtistsRegex.exec(songTitle);
    featArtistsRegex.lastIndex = 0;

    if (featArtistsExec && featArtistsExec.groups?.featArtists) {
      const { featArtists: featArtistsStr } = featArtistsExec.groups;

      const featArtists = featArtistsStr.split(separateArtistsRegex);
      const filteredFeatArtists = featArtists.filter((featArtistName) => {
        const isArtistAvailable = artistNames.some(
          (name) =>
            name.toLowerCase().trim() === featArtistName.toLowerCase().trim(),
        );

        return (
          featArtistName !== undefined &&
          featArtistName.trim() !== '' &&
          !isArtistAvailable
        );
      });
      const trimmedFeatArtists = filteredFeatArtists.map((x) => x.trim());

      setSeparatedFeatArtistsNames([...new Set(trimmedFeatArtists)]);
    } else setSeparatedFeatArtistsNames([]);
  }, [artistNames, songTitle]);

  const artistComponents = React.useMemo(() => {
    if (separatedFeatArtistsNames.length > 0) {
      const artists = separatedFeatArtistsNames.map((artist, i, arr) => {
        return (
          <span key={artist}>
            <span className="text-font-color-highlight dark:text-dark-font-color-highlight">
              {artist}
            </span>
            {i !== arr.length - 1 && (
              <span>
                {i === arr.length - 2 ? ` ${t('common.and')} ` : ', '}
              </span>
            )}
          </span>
        );
      });

      return artists;
    }
    return [];
  }, [separatedFeatArtistsNames, t]);

  const addFeatArtistsToSong = React.useCallback(
    (
      setIsDisabled: (_state: boolean) => void,
      setIsPending: (_state: boolean) => void,
    ) => {
      setIsDisabled(true);
      setIsPending(true);

      window.api.suggestions
        .resolveFeaturingArtists(
          songId,
          separatedFeatArtistsNames,
          isRemovingFeatInfoFromTitle,
        )
        .then((res) => {
          if (res?.updatedData) {
            updateSongInfo((prevData) => {
              const updatedArtists: typeof prevData.artists =
                res?.updatedData?.artists?.map((artist) => ({
                  name: artist.name,
                  artistId: artist.artistId,
                }));

              prevData.title = res.updatedData?.title || prevData.title;
              prevData.artists = updatedArtists;

              return prevData;
            });
            if (currentSongData.songId === res.updatedData.songId)
              updateCurrentSongData((prevData) => ({
                ...prevData,
                ...res.updatedData,
              }));
          }
          setIsIgnored(true);

          return addNewNotifications([
            {
              content: t('common.featArtistSuggestionResolved'),
              iconName: 'done',
              delay: 5000,
              id: 'FeatArtistsSuggestion',
            },
          ]);
        })
        .finally(() => {
          setIsDisabled(false);
          setIsPending(false);
        })
        .catch((err) => console.error(err));
    },
    [
      songId,
      separatedFeatArtistsNames,
      isRemovingFeatInfoFromTitle,
      addNewNotifications,
      t,
      updateSongInfo,
      currentSongData.songId,
      updateCurrentSongData,
    ],
  );

  const ignoreSuggestion = React.useCallback(() => {
    storage.ignoredSongsWithFeatArtists.setIgnoredSongsWithFeatArtists([
      songId,
    ]);

    setIsIgnored(true);
    addNewNotifications([
      {
        id: 'suggestionIgnored',
        iconName: 'do_not_disturb_on',
        iconClassName: 'material-icons-round-outlined',
        delay: 5000,
        content: t('notifications.suggestionIgnored'),
      },
    ]);
  }, [addNewNotifications, songId, t]);

  return (
    <>
      {separatedFeatArtistsNames.length > 0 && !isIgnored && (
        <div
          className={`appear-from-bottom mx-auto mt-8 w-[90%] rounded-lg p-4 text-black shadow-md transition-[width,height] dark:text-white ${
            bodyBackgroundImage
              ? 'bg-background-color-2/75 backdrop-blur-sm dark:bg-dark-background-color-2/75'
              : 'bg-background-color-2 dark:bg-dark-background-color-2'
          } `}
        >
          <label
            htmlFor="toggleSuggestionBox"
            className="title-container flex cursor-pointer items-center justify-between font-medium text-font-color-highlight dark:text-dark-font-color-highlight"
          >
            <div className="flex items-center">
              <span className="material-icons-round-outlined mr-2 text-2xl">
                help
              </span>{' '}
              {t('common.suggestion')}{' '}
            </div>
            <div className="flex items-center">
              <span
                className="material-icons-round-outlined mr-4 text-xl"
                title="This feature is still in the experimental state."
              >
                science
              </span>
              <Button
                id="toggleSuggestionBox"
                className="!m-0 !border-0 !p-0 outline-1 outline-offset-1 hover:bg-background-color-1/50 focus-visible:!outline hover:dark:bg-dark-background-color-1/50"
                iconClassName="!leading-none !text-3xl"
                iconName={
                  isMessageVisible ? 'arrow_drop_up' : 'arrow_drop_down'
                }
                tooltipLabel={`common.${
                  isMessageVisible ? 'hideSuggestion' : 'showSuggestion'
                }`}
                clickHandler={(e) => {
                  e.preventDefault();
                  setIsMessageVisible((state) => !state);
                }}
              />
            </div>
          </label>
          {isMessageVisible && (
            <div>
              <div>
                <Trans
                  i18nKey="featArtistsSuggestion.message"
                  values={{ count: separatedFeatArtistsNames.length }}
                  components={{
                    p: <p className="mt-2 text-sm" />,
                    span: <span>{artistComponents}</span>,
                  }}
                />
                <Checkbox
                  id="featArtistsTitleReset"
                  labelContent={t(
                    'featArtistsSuggestion.featArtistsTitleReset',
                  )}
                  className="my-4 !text-sm"
                  isChecked={isRemovingFeatInfoFromTitle}
                  checkedStateUpdateFunction={(state) =>
                    setIsRemovingFeatInfoFromTitle(state)
                  }
                />
              </div>
              <div className="mt-3 flex items-center">
                <Button
                  className="!border-0 bg-background-color-1/50 !px-4 !py-2 outline-1 transition-colors hover:bg-background-color-1 hover:!text-font-color-highlight focus-visible:!outline dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:!text-dark-font-color-highlight"
                  iconName="verified"
                  iconClassName="material-icons-round-outlined"
                  label={t('featArtistsSuggestion.addArtistsToSong', {
                    count: separatedFeatArtistsNames.length,
                  })}
                  clickHandler={(_, setIsDisabled, setIsPending) =>
                    addFeatArtistsToSong(setIsDisabled, setIsPending)
                  }
                />
                <Button
                  className="!border-0 bg-background-color-1/50 !px-4 !py-2 outline-1 transition-colors hover:bg-background-color-1 hover:!text-font-color-highlight focus-visible:!outline dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:!text-dark-font-color-highlight"
                  iconName="edit"
                  iconClassName="material-icons-round-outlined"
                  label={t('featArtistsSuggestion.editInMetadataEditingPage')}
                  clickHandler={() =>
                    changeCurrentActivePage('SongTagsEditor', {
                      songId,
                      songPath: path,
                      isKnownSource: true,
                    })
                  }
                />
                <Button
                  className="!mr-0 !border-0 bg-background-color-1/50 !px-4 !py-2 outline-1 transition-colors hover:bg-background-color-1 hover:!text-font-color-highlight focus-visible:!outline dark:bg-dark-background-color-1/50 dark:hover:bg-dark-background-color-1 dark:hover:!text-dark-font-color-highlight"
                  iconName="do_not_disturb_on"
                  iconClassName="material-icons-round-outlined"
                  label={t('common.ignore')}
                  clickHandler={ignoreSuggestion}
                />
                <span
                  className="material-icons-round-outlined ml-4 cursor-pointer text-xl opacity-80 transition-opacity hover:opacity-100"
                  title={t('featArtistsSuggestion.modificationNotice')}
                >
                  info
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SongsWithFeaturingArtistsSuggestion;
