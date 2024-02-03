/* eslint-disable import/first */
/* eslint-disable default-param-last */
/* eslint-disable no-use-before-define */
/* eslint-disable global-require */
import path from 'path';
import os from 'os';
import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
  shell,
  protocol,
  crashReporter,
  nativeTheme,
  Tray,
  Menu,
  nativeImage,
  OpenDialogOptions,
  powerMonitor,
  SaveDialogOptions,
  net,
} from 'electron';
import debug from 'electron-debug';
import 'dotenv/config';

// import * as Sentry from '@sentry/electron';
import log, { logFilePath } from './log';
import {
  getSongsData,
  getUserData,
  setUserData as saveUserData,
  resetAppCache,
  getListeningData,
  getBlacklistData,
  setUserData,
} from './filesystem';
import { resolveHtmlPath } from './utils/util';
import updateSongId3Tags, {
  isMetadataUpdatesPending,
  savePendingMetadataUpdates,
} from './updateSongId3Tags';
import { version, appPreferences } from '../../package.json';
import search from './search';
import {
  searchSongMetadataResultsInInternet,
  fetchSongMetadataFromInternet,
} from './utils/fetchSongMetadataFromInternet';
import deleteSongsFromSystem from './core/deleteSongsFromSystem';
import removeMusicFolder from './core/removeMusicFolder';
import restoreBlacklistedSongs from './core/restoreBlacklistedSongs';
import addWatchersToFolders from './fs/addWatchersToFolders';
import addSongsFromFolderStructures from './core/addMusicFolder';
import getArtistInfoFromNet from './core/getArtistInfoFromNet';
import getSongLyrics from './core/getSongLyrics';
import sendAudioDataFromPath from './core/sendAudioDataFromPath';
import getAssetPath from './utils/getAssetPath';
import addWatchersToParentFolders from './fs/addWatchersToParentFolders';
import manageTaskbarPlaybackButtonControls from './core/manageTaskbarPlaybackButtonControls';
import checkForStartUpSongs from './core/checkForStartUpSongs';
import checkForNewSongs from './core/checkForNewSongs';
import sendAudioData from './core/sendAudioData';
import toggleLikeSongs from './core/toggleLikeSongs';
import sendSongID3Tags from './core/sendSongId3Tags';
import removeSongFromPlaylist from './core/removeSongFromPlaylist';
import addSongsToPlaylist from './core/addSongsToPlaylist';
import removePlaylists from './core/removePlaylists';
import addNewPlaylist from './core/addNewPlaylist';
import getAllSongs from './core/getAllSongs';
import toggleLikeArtists from './core/toggleLikeArtists';
import fetchSongInfoFromLastFM from './core/fetchSongInfoFromLastFM';
import clearSongHistory from './core/clearSongHistory';
import clearSearchHistoryResults from './core/clearSeachHistoryResults';
import getSongInfo from './core/getSongInfo';
import updateSongListeningData from './core/updateSongListeningData';
import getGenresInfo from './core/getGenresInfo';
import sendPlaylistData from './core/sendPlaylistData';
import fetchAlbumData from './core/fetchAlbumData';
import fetchArtistData from './core/fetchArtistData';
import { changeAppTheme } from './core/changeAppTheme';
import saveLyricsToSong, { savePendingSongLyrics } from './saveLyricsToSong';
import getMusicFolderData from './core/getMusicFolderData';
import {
  closeAllAbortControllers,
  saveAbortController,
} from './fs/controlAbortControllers';
import blacklistSongs from './core/blacklistSongs';
import resetAppData from './resetAppData';
import { clearTempArtworkFolder } from './other/artworks';
import blacklistFolders from './core/blacklistFolders';
import restoreBlacklistedFolders from './core/restoreBlacklistedFolder';
import toggleBlacklistFolders from './core/toggleBlacklistFolders';
import getStorageUsage from './core/getStorageUsage';
import { generatePalettes } from './other/generatePalette';
import { getFolderStructures } from './core/getFolderStructures';
import { getArtistDuplicates } from './core/getDuplicates';
import { resolveArtistDuplicates } from './core/resolveDuplicates';
import addArtworkToAPlaylist from './core/addArtworkToAPlaylist';
import getArtworksForMultipleArtworksCover from './core/getArtworksForMultipleArtworksCover';
import { resolveSeparateArtists } from './core/resolveSeparateArtists';
import resolveFeaturingArtists from './core/resolveFeaturingArtists';
import saveArtworkToSystem from './core/saveArtworkToSystem';
import exportAppData from './core/exportAppData';
import importAppData from './core/importAppData';
import exportPlaylist from './core/exportPlaylist';
import importPlaylist from './core/importPlaylist';
import reParseSong from './parseSong/reParseSong';
import { compare } from './utils/safeStorage';
import manageLastFmAuth from './auth/manageLastFmAuth';
import scrobbleSong from './other/lastFm/scrobbleSong';
import getSimilarTracks from './other/lastFm/getSimilarTracks';
import sendNowPlayingSongDataToLastFM from './other/lastFm/sendNowPlayingSongDataToLastFM';
import getAlbumInfoFromLastFM from './other/lastFm/getAlbumInfoFromLastFM';
import renameAPlaylist from './core/renameAPlaylist';
import { removeDefaultAppProtocolFromFilePath } from './fs/resolveFilePaths';

// / / / / / / / CONSTANTS / / / / / / / / /
const DEFAULT_APP_PROTOCOL = 'nora';

const MAIN_WINDOW_MIN_SIZE_X = 700;
const MAIN_WINDOW_MIN_SIZE_Y = 500;
const MAIN_WINDOW_MAX_SIZE_X = 10000;
const MAIN_WINDOW_MAX_SIZE_Y = 5000;
const MAIN_WINDOW_ASPECT_RATIO = 0;

const MAIN_WINDOW_DEFAULT_SIZE_X = 1280;
const MAIN_WINDOW_DEFAULT_SIZE_Y = 720;

const MINI_PLAYER_MIN_SIZE_X = 270;
const MINI_PLAYER_MIN_SIZE_Y = 200;
const MINI_PLAYER_MAX_SIZE_X = 510;
const MINI_PLAYER_MAX_SIZE_Y = 300;
const MINI_PLAYER_ASPECT_RATIO = 17 / 10;
const abortController = new AbortController();
const DEFAULT_OPEN_DIALOG_OPTIONS: OpenDialogOptions = {
  title: 'Select a Music Folder',
  buttonLabel: 'Add folder',
  filters: [
    {
      name: 'Audio Files',
      extensions: appPreferences.supportedMusicExtensions,
    },
  ],
  properties: ['openDirectory', 'multiSelections'],
};
const DEFAULT_SAVE_DIALOG_OPTIONS: SaveDialogOptions = {
  title: 'Select the destination to Save',
  buttonLabel: 'Save',
  properties: ['createDirectory', 'showOverwriteConfirmation'],
};

// / / / / / / VARIABLES / / / / / / /
// eslint-disable-next-line import/no-mutable-exports
export let mainWindow: BrowserWindow;
let tray: Tray;
let isMiniPlayer = false;
// let isConnectedToInternet = false;
let isAudioPlaying = false;
let isOnBatteryPower = false;
let currentSongPath: string;

// / / / / / / INITIALIZATION / / / / / / /

// Behaviour on second instance for parent process
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  log(
    'Another app instance is currently active. Quitting this instance.',
    undefined,
    'WARN',
  );
  app.quit();
} else app.on('second-instance', handleSecondInstances);

const IS_DEVELOPMENT =
  !app.isPackaged || process.env.NODE_ENV === 'development';

const appIcon = nativeImage.createFromPath(
  getAssetPath('images', 'CaesarAILogoDark.png'),
);

// dotenv.config({ debug: true });
saveAbortController('main', abortController);

// Sentry.init({
//   dsn: process.env.SENTRY_DSN,
// });
// ? / / / / / / / / / / / / / / / / / / / / / / /
debug();
const APP_INFO = {
  environment: IS_DEVELOPMENT ? 'DEV' : 'PRODUCTION',
  appVersion: `v${version}`,
  systemInfo: {
    cpu: os.cpus()[0].model,
    os: os.release(),
    architechture: os.arch(),
    platform: os.platform(),
    totalMemory: `${os.totalmem()} (~${Math.floor(
      os.totalmem() / (1024 * 1024 * 1024),
    )} GB)`,
  },
};

log(`STARTING UP NORA`, APP_INFO, 'WARN');

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch((err: unknown) =>
      log(
        `====== ERROR OCCURRED WHEN TRYING TO INSTALL EXTENSIONS TO DEVTOOLS ======\nERROR : ${err}`,
      ),
    );
};

const getBackgroundColor = () => {
  const userData = getUserData();
  if (userData.theme.isDarkMode) return 'hsla(228, 7%, 14%, 100%)';
  return 'hsl(0, 0%, 100%)';
};

const createWindow = async () => {
  if (IS_DEVELOPMENT) installExtensions();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 700,
    minHeight: 500,
    minWidth: 700,
    title: 'CaesarAIMusic',
    webPreferences: {
      devTools: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    visualEffectState: 'followWindow',
    roundedCorners: true,
    frame: false,
    backgroundColor: getBackgroundColor(),
    icon: appIcon,
    titleBarStyle: 'hidden',
    show: false,
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.once('ready-to-show', () => {
    if (app.hasSingleInstanceLock()) {
      log('Started checking for new songs during the application start.');
      checkForNewSongs();
      addWatchersToFolders();
      addWatchersToParentFolders();
    }
  });
  mainWindow.webContents.setWindowOpenHandler((edata: { url: string }) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

// protocol.registerSchemesAsPrivileged([
//   {
//     scheme: 'nora',
//     privileges: {
//       // standard: true,
//       // secure: true,
//       stream: true, // Add this if you intend to use the protocol for streaming i.e. in video/audio html tags.
//       // supportFetchAPI: true, // Add this if you want to use fetch with this protocol.
//       // corsEnabled: true, // Add this if you need to enable cors for this protocol.
//     },
//   },
// ]);

app
  .whenReady()
  .then(() => {
    const userData = getUserData();

    if (BrowserWindow.getAllWindows().length === 0) createWindow();

    if (userData.windowState === 'maximized') mainWindow.maximize();

    if (!app.isDefaultProtocolClient(DEFAULT_APP_PROTOCOL)) {
      log(
        'No default protocol registered. Starting the default protocol registration process.',
      );
      const res = app.setAsDefaultProtocolClient(DEFAULT_APP_PROTOCOL);
      if (res) log('Default protocol registered successfully.');
      else log('Default protocol registration failed.');
    }

    // protocol.handle('nora', registerFileProtocol);

    protocol.registerFileProtocol('nora', registerFileProtocol);

    tray = new Tray(appIcon);
    const trayContextMenu = Menu.buildFromTemplate([
      {
        label: 'Show/Hide Nora',
        type: 'normal',
        click: () =>
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show(),
        role: 'hide',
      },
      { type: 'separator' },
      { label: 'Exit', type: 'normal', click: () => app.quit(), role: 'close' },
    ]);

    tray.setContextMenu(trayContextMenu);
    tray.setToolTip('CaesarAIMusic');

    tray.addListener('click', () => tray.popUpContextMenu(trayContextMenu));
    tray.addListener('double-click', () => {
      if (mainWindow.isVisible()) mainWindow.hide();
      else mainWindow.show();
    });

    // powerMonitor.addListener('shutdown', (e) => e.preventDefault());

    mainWindow.webContents.once('did-finish-load', manageWindowFinishLoad);

    app.on('before-quit', handleBeforeQuit);

    mainWindow.on('moved', manageAppMoveEvent);

    mainWindow.on('resized', () => {
      manageAppMoveEvent();
      manageAppResizeEvent();
    });

    mainWindow.on('maximize', () => recordWindowState('maximized'));

    mainWindow.on('minimize', () => recordWindowState('minimized'));

    mainWindow.on('unmaximize', () => recordWindowState('normal'));

    mainWindow.on('restore', () => recordWindowState('normal'));

    // app.setPath('crashDumps', path.join(app.getPath('userData'), 'crashDumps'));

    app.on('will-finish-launching', () => {
      crashReporter.start({ uploadToServer: false });
      log(
        `APP STARTUP COMMAND LINE ARGUMENTS\nARGS : [ ${process.argv.join(
          ', ',
        )} ]`,
      );
    });

    mainWindow.webContents.addListener('zoom-changed', (_, dir) =>
      log(`Renderer zoomed ${dir}. ${mainWindow.webContents.getZoomLevel()}`),
    );

    // ? / / / / / / / / /  IPC RENDERER EVENTS  / / / / / / / / / / / /
    if (mainWindow) {
      ipcMain.on('app/close', () => app.quit());

      ipcMain.on('app/minimize', () => mainWindow.minimize());

      ipcMain.on('app/toggleMaximize', () =>
        mainWindow.isMaximized()
          ? mainWindow.unmaximize()
          : mainWindow.maximize(),
      );

      ipcMain.on('app/hide', () => mainWindow.hide());

      ipcMain.on('app/show', () => mainWindow.show());

      ipcMain.on('app/changeAppTheme', (_, theme?: AppTheme) =>
        changeAppTheme(theme),
      );

      ipcMain.on(
        'app/player/songPlaybackStateChange',
        (_: unknown, isPlaying: boolean) => {
          console.log(`Player playback status : ${isPlaying}`);
          isAudioPlaying = isPlaying;
          manageTaskbarPlaybackButtonControls(mainWindow, true, isPlaying);
        },
      );

      ipcMain.handle('app/checkForStartUpSongs', () => checkForStartUpSongs());

      mainWindow.on('focus', () => {
        mainWindow.webContents.send('app/focused');
        mainWindow.flashFrame(false);
      });
      mainWindow.on('blur', () => mainWindow.webContents.send('app/blurred'));

      mainWindow.on('enter-full-screen', () => {
        console.log('Entered full screen');
        mainWindow.webContents.send('app/enteredFullscreen');
      });
      mainWindow.on('leave-full-screen', () => {
        console.log('Left full screen');
        mainWindow.webContents.send('app/leftFullscreen');
      });
      powerMonitor.addListener('on-ac', toggleOnBatteryPower);
      powerMonitor.addListener('on-battery', toggleOnBatteryPower);

      ipcMain.on('app/getSongPosition', (_, position: number) =>
        saveUserData('currentSong.stoppedPosition', position),
      );

      ipcMain.handle(
        'app/addSongsFromFolderStructures',
        (_, structures: FolderStructure[]) =>
          addSongsFromFolderStructures(structures),
      );

      ipcMain.handle('app/getSong', (_, id: string) => sendAudioData(id));

      ipcMain.handle('app/getSongFromUnknownSource', (_, songPath: string) =>
        sendAudioDataFromPath(songPath),
      );

      ipcMain.handle(
        'app/toggleLikeSongs',
        (_, songIds: string[], likeSong?: boolean) =>
          toggleLikeSongs(songIds, likeSong),
      );

      ipcMain.handle(
        'app/toggleLikeArtists',
        (_, artistIds: string[], likeArtist?: boolean) =>
          toggleLikeArtists(artistIds, likeArtist),
      );

      ipcMain.handle(
        'app/getAllSongs',
        (_, sortType?: SongSortTypes, paginatingData?: PaginatingData) =>
          getAllSongs(sortType, paginatingData),
      );

      ipcMain.handle(
        'app/saveUserData',
        (_, dataType: UserDataTypes, data: string) =>
          saveUserData(dataType, data),
      );

      ipcMain.handle('app/getStorageUsage', (_, forceRefresh?: boolean) =>
        getStorageUsage(forceRefresh),
      );

      ipcMain.handle('app/getUserData', () => getUserData());

      ipcMain.handle(
        'app/search',
        (
          _,
          searchFilters: SearchFilters,
          value: string,
          updateSearchHistory?: boolean,
          isPredictiveSearchEnabled?: boolean,
        ) =>
          search(
            searchFilters,
            value,
            updateSearchHistory,
            isPredictiveSearchEnabled,
          ),
      );

      ipcMain.handle(
        'app/getSongLyrics',
        (
          _,
          trackInfo: LyricsRequestTrackInfo,
          lyricsType?: LyricsTypes,
          lyricsRequestType?: LyricsRequestTypes,
          saveLyricsAutomatically?: AutomaticallySaveLyricsTypes,
        ) =>
          getSongLyrics(
            trackInfo,
            lyricsType,
            lyricsRequestType,
            saveLyricsAutomatically,
          ),
      );

      ipcMain.handle(
        'app/saveLyricsToSong',
        (_, songPath: string, lyrics: SongLyrics) =>
          saveLyricsToSong(songPath, lyrics),
      );

      ipcMain.handle(
        'app/getSongInfo',
        (
          _,
          songIds: string[],
          sortType?: SongSortTypes,
          limit?: number,
          preserveIdOrder = false,
        ) => getSongInfo(songIds, sortType, limit, preserveIdOrder),
      );

      ipcMain.handle('app/getSimilarTracksForASong', (_, songId: string) =>
        getSimilarTracks(songId),
      );

      ipcMain.handle('app/getAlbumInfoFromLastFM', (_, albumId: string) =>
        getAlbumInfoFromLastFM(albumId),
      );

      ipcMain.handle('app/getSongListeningData', (_, songIds: string[]) =>
        getListeningData(songIds),
      );

      ipcMain.handle(
        'app/updateSongListeningData',
        <
          DataType extends keyof ListeningDataTypes,
          Value extends ListeningDataTypes[DataType],
        >(
          _: unknown,
          songId: string,
          dataType: DataType,
          value: Value,
        ) => updateSongListeningData(songId, dataType, value),
      );

      ipcMain.handle('app/generatePalettes', generatePalettes);

      ipcMain.handle(
        'app/scrobbleSong',
        (_, songId: string, startTimeInSecs: number) =>
          scrobbleSong(songId, startTimeInSecs),
      );

      ipcMain.handle(
        'app/sendNowPlayingSongDataToLastFM',
        (_, songId: string) => sendNowPlayingSongDataToLastFM(songId),
      );

      ipcMain.handle('app/getArtistArtworks', (_, artistId: string) =>
        getArtistInfoFromNet(artistId),
      );

      ipcMain.handle(
        'app/fetchSongInfoFromNet',
        (_, songTitle: string, songArtists: string[]) =>
          fetchSongInfoFromLastFM(songTitle, songArtists),
      );

      ipcMain.handle(
        'app/searchSongMetadataResultsInInternet',
        (_, songTitle: string, songArtists: string[]) =>
          searchSongMetadataResultsInInternet(songTitle, songArtists),
      );

      ipcMain.handle(
        'app/fetchSongMetadataFromInternet',
        (_, source: SongMetadataSource, sourceId: string) =>
          fetchSongMetadataFromInternet(source, sourceId),
      );

      ipcMain.handle(
        'app/getArtistData',
        (
          _,
          artistIdsOrNames?: string[],
          sortType?: ArtistSortTypes,
          limit?: number,
        ) => fetchArtistData(artistIdsOrNames, sortType, limit),
      );

      ipcMain.handle(
        'app/getGenresData',
        (_, genreNamesOrIds?: string[], sortType?: GenreSortTypes) =>
          getGenresInfo(genreNamesOrIds, sortType),
      );

      ipcMain.handle(
        'app/getAlbumData',
        (_, albumTitlesOrIds?: string[], sortType?: AlbumSortTypes) =>
          fetchAlbumData(albumTitlesOrIds, sortType),
      );

      ipcMain.handle(
        'app/getPlaylistData',
        (
          _,
          playlistIds?: string[],
          sortType?: AlbumSortTypes,
          onlyMutablePlaylists = false,
        ) => sendPlaylistData(playlistIds, sortType, onlyMutablePlaylists),
      );

      ipcMain.handle('app/getArtistDuplicates', (_, artistName: string) =>
        getArtistDuplicates(artistName),
      );

      ipcMain.handle(
        'app/resolveArtistDuplicates',
        (_, selectedArtistId: string, duplicateIds: string[]) =>
          resolveArtistDuplicates(selectedArtistId, duplicateIds),
      );

      ipcMain.handle(
        'app/resolveSeparateArtists',
        (_, separateArtistId: string, separateArtistNames: string[]) =>
          resolveSeparateArtists(separateArtistId, separateArtistNames),
      );

      ipcMain.handle(
        'app/resolveFeaturingArtists',
        (
          _,
          songId: string,
          featArtistNames: string[],
          removeFeatInfoInTitle?: boolean,
        ) =>
          resolveFeaturingArtists(
            songId,
            featArtistNames,
            removeFeatInfoInTitle,
          ),
      );

      ipcMain.handle(
        'app/addNewPlaylist',
        (_, playlistName: string, songIds?: string[], artworkPath?: string) =>
          addNewPlaylist(playlistName, songIds, artworkPath),
      );

      ipcMain.handle('app/removePlaylists', (_, playlistIds: string[]) =>
        removePlaylists(playlistIds),
      );

      ipcMain.handle(
        'app/addSongsToPlaylist',
        (_, playlistId: string, songIds: string[]) =>
          addSongsToPlaylist(playlistId, songIds),
      );

      ipcMain.handle(
        'app/removeSongFromPlaylist',
        (_, playlistId: string, songId: string) =>
          removeSongFromPlaylist(playlistId, songId),
      );

      ipcMain.handle(
        'app/addArtworkToAPlaylist',
        (_, playlistId: string, artworkPath: string) =>
          addArtworkToAPlaylist(playlistId, artworkPath),
      );

      ipcMain.handle(
        'app/renameAPlaylist',
        (_, playlistId: string, newName: string) =>
          renameAPlaylist(playlistId, newName),
      );

      ipcMain.handle('app/clearSongHistory', () => clearSongHistory());

      ipcMain.handle(
        'app/deleteSongsFromSystem',
        (_, absoluteFilePaths: string[], isPermanentDelete: boolean) =>
          deleteSongsFromSystem(
            absoluteFilePaths,
            abortController.signal,
            isPermanentDelete,
          ),
      );

      ipcMain.handle('app/resyncSongsLibrary', async () => {
        await checkForNewSongs();
        sendMessageToRenderer({ messageCode: 'RESYNC_SUCCESSFUL' });
      });

      ipcMain.handle('app/getBlacklistData', getBlacklistData);

      ipcMain.handle('app/blacklistSongs', (_, songIds: string[]) =>
        blacklistSongs(songIds),
      );

      ipcMain.handle('app/restoreBlacklistedSongs', (_, songIds: string[]) =>
        restoreBlacklistedSongs(songIds),
      );

      ipcMain.handle(
        'app/updateSongId3Tags',
        (
          _,
          songIdOrPath: string,
          tags: SongTags,
          sendUpdatedData?: boolean,
          isKnownSource = true,
        ) =>
          updateSongId3Tags(songIdOrPath, tags, sendUpdatedData, isKnownSource),
      );

      ipcMain.handle('app/getImgFileLocation', getImagefileLocation);

      ipcMain.handle('app/getFolderLocation', getFolderLocation);

      ipcMain.handle(
        'app/getSongId3Tags',
        (_, songId: string, isKnownSource = true) =>
          sendSongID3Tags(songId, isKnownSource),
      );

      ipcMain.handle('app/clearSearchHistory', (_, searchText?: string[]) =>
        clearSearchHistoryResults(searchText),
      );

      ipcMain.handle('app/getFolderStructures', () => getFolderStructures());

      ipcMain.handle('app/reParseSong', (_, songPath: string) =>
        reParseSong(songPath),
      );

      ipcMain.on('app/resetApp', () => resetApp(!IS_DEVELOPMENT));

      ipcMain.on('app/openLogFile', () => shell.openPath(logFilePath));

      ipcMain.on('app/revealSongInFileExplorer', (_, songId: string) =>
        revealSongInFileExplorer(songId),
      );

      ipcMain.on('app/revealFolderInFileExplorer', (_, folderPath: string) =>
        shell.showItemInFolder(folderPath),
      );

      ipcMain.on(
        'app/saveArtworkToSystem',
        (_, songId: string, saveName?: string) =>
          saveArtworkToSystem(songId, saveName),
      );

      ipcMain.on('app/openInBrowser', (_, url: string) =>
        shell.openExternal(url),
      );

      ipcMain.on('app/loginToLastFmInBrowser', () =>
        shell.openExternal(
          `http://www.last.fm/api/auth/?api_key=${process.env.LAST_FM_API_KEY}&cb=nora://auth?service=lastfm`,
        ),
      );

      ipcMain.handle('app/exportAppData', (_, localStorageData: string) =>
        exportAppData(localStorageData),
      );

      ipcMain.handle('app/exportPlaylist', (_, playlistId: string) =>
        exportPlaylist(playlistId),
      );

      ipcMain.handle('app/importAppData', importAppData);

      ipcMain.handle('app/importPlaylist', importPlaylist);

      ipcMain.handle(
        'app/getRendererLogs',
        (
          _: unknown,
          mes: string | Error,
          data?: Record<string, unknown>,
          logToConsoleType: LogMessageTypes = 'INFO',
          forceWindowRestart = false,
          forceMainRestart = false,
        ) =>
          getRendererLogs(
            mes,
            data,
            logToConsoleType,
            forceWindowRestart,
            forceMainRestart,
          ),
      );

      ipcMain.handle('app/removeAMusicFolder', (_, absolutePath: string) =>
        removeMusicFolder(absolutePath),
      );

      ipcMain.handle('app/toggleMiniPlayer', (_, isMiniPlayerActive: boolean) =>
        toggleMiniPlayer(isMiniPlayerActive),
      );

      ipcMain.handle(
        'app/toggleMiniPlayerAlwaysOnTop',
        (_, isMiniPlayerAlwaysOnTop: boolean) =>
          toggleMiniPlayerAlwaysOnTop(isMiniPlayerAlwaysOnTop),
      );

      ipcMain.handle('app/toggleAutoLaunch', (_, autoLaunchState: boolean) =>
        toggleAutoLaunch(autoLaunchState),
      );

      ipcMain.handle(
        'app/getFolderData',
        (_, folderPaths?: string[], sortType?: FolderSortTypes) =>
          getMusicFolderData(folderPaths, sortType),
      );

      ipcMain.handle(
        'app/compareEncryptedData',
        (_, data: string, encryptedData: string) =>
          compare(data, encryptedData),
      );

      ipcMain.handle('app/isMetadataUpdatesPending', (_, songPath: string) =>
        isMetadataUpdatesPending(
          removeDefaultAppProtocolFromFilePath(songPath),
        ),
      );

      ipcMain.handle('app/blacklistFolders', (_, folderPaths: string[]) =>
        blacklistFolders(folderPaths),
      );

      ipcMain.handle(
        'app/restoreBlacklistedFolders',
        (_, folderPaths: string[]) => restoreBlacklistedFolders(folderPaths),
      );

      ipcMain.handle(
        'app/toggleBlacklistedFolders',
        (_, folderPaths: string[], isBlacklistFolder?: boolean) =>
          toggleBlacklistFolders(folderPaths, isBlacklistFolder),
      );

      ipcMain.on(
        'app/networkStatusChange',
        (_: unknown, isConnected: boolean) => {
          log(
            isConnected
              ? `APP CONNECTED TO THE INTERNET SUCCESSFULLY`
              : `APP DISCONNECTED FROM THE INTERNET`,
          );
          // isConnectedToInternet = isConnected;
        },
      );

      ipcMain.handle(
        'app/getArtworksForMultipleArtworksCover',
        (_, songIds: string[]) => getArtworksForMultipleArtworksCover(songIds),
      );

      ipcMain.on('app/openDevTools', () => {
        log('USER REQUESTED FOR DEVTOOLS.');
        mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
      });

      ipcMain.on('app/restartRenderer', (_: unknown, reason: string) => {
        log(`RENDERER REQUESTED A RENDERER REFRESH.\nREASON : ${reason}`);
        restartRenderer();
      });

      ipcMain.on('app/restartApp', (_: unknown, reason: string) =>
        restartApp(reason),
      );

      //  / / / / / / / / / / / GLOBAL SHORTCUTS / / / / / / / / / / / / / /
      // globalShortcut.register('F5', () => {
      //   const isFocused = mainWindow.isFocused();
      //   log('USER REQUESTED RENDERER REFRESH USING GLOBAL SHORTCUT.', {
      //     isFocused,
      //   });
      //   if (isFocused) restartRenderer();
      // });

      globalShortcut.register('F12', () => {
        log(
          'USER REQUESTED FOR DEVTOOLS USING GLOBAL SHORTCUT. - REQUEST WONT BE SERVED.',
        );
        // mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });
      });
    }
    return undefined;
  })
  .catch((err) => console.log(err));

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// / / / / / / / / / / / / / / / / / / / / / / / / / / / /
function manageWindowFinishLoad() {
  const { windowDiamensions, windowPositions } = getUserData();
  if (windowPositions.mainWindow) {
    const { x, y } = windowPositions.mainWindow;
    mainWindow.setPosition(x, y, true);
  } else {
    mainWindow.center();
    const [x, y] = mainWindow.getPosition();
    saveUserData('windowPositions.mainWindow', { x, y });
  }

  if (windowDiamensions.mainWindow) {
    const { x, y } = windowDiamensions.mainWindow;
    mainWindow.setSize(
      x || MAIN_WINDOW_DEFAULT_SIZE_X,
      y || MAIN_WINDOW_DEFAULT_SIZE_Y,
      true,
    );
  }

  mainWindow.show();

  if (IS_DEVELOPMENT)
    mainWindow.webContents.openDevTools({ mode: 'detach', activate: true });

  log(`STARTING UP THE RENDERER.`, undefined, 'WARN');

  manageTaskbarPlaybackButtonControls(mainWindow, true, false);

  nativeTheme.addListener('updated', () => {
    watchForSystemThemeChanges();
    manageTaskbarPlaybackButtonControls(mainWindow, true, isAudioPlaying);
  });
}

function handleBeforeQuit() {
  mainWindow.webContents.send('app/beforeQuitEvent');
  savePendingSongLyrics(currentSongPath, true);
  savePendingMetadataUpdates(currentSongPath, true);
  closeAllAbortControllers();
  clearTempArtworkFolder();
  log(
    `QUITING NORA`,
    { uptime: `${Math.floor(process.uptime())} seconds` },
    'WARN',
  );
}

function toggleOnBatteryPower() {
  isOnBatteryPower = powerMonitor.isOnBatteryPower();
  mainWindow.webContents.send('app/isOnBatteryPower', isOnBatteryPower);
}

export function sendMessageToRenderer(props: MessageToRendererProps) {
  const { messageCode, data } = props;

  mainWindow.webContents.send(
    'app/sendMessageToRendererEvent',
    messageCode,
    data,
  );
}

let dataUpdateEventTimeOutId: NodeJS.Timeout;
let dataEventsCache: DataUpdateEvent[] = [];
export function dataUpdateEvent(
  dataType: DataUpdateEventTypes,
  data = [] as string[],
  message?: string,
) {
  if (dataUpdateEventTimeOutId) clearTimeout(dataUpdateEventTimeOutId);
  log(
    `Data update event fired with updated '${dataType}'.${
      data.length > 0 || message ? '\n' : ''
    }${data.length > 0 ? `DATA : ${data}; ` : ''}${
      message ? `MESSAGE : ${data}; ` : ''
    }`,
  );
  addEventsToCache(dataType, data, message);
  dataUpdateEventTimeOutId = setTimeout(() => {
    console.log(dataEventsCache);
    mainWindow.webContents.send(
      'app/dataUpdateEvent',
      dataEventsCache,
      data,
      message,
    );
    dataEventsCache = [];
  }, 1000);
}

function addEventsToCache(
  dataType: DataUpdateEventTypes,
  data = [] as string[],
  message?: string,
) {
  for (let i = 0; i < dataEventsCache.length; i += 1) {
    if (dataEventsCache[i].dataType === dataType) {
      if (data.length > 0 || message) {
        return dataEventsCache[i].eventData.push({ data, message });
      }
      return undefined;
    }
  }
  return dataEventsCache.push({
    dataType,
    eventData: data.length > 0 || message ? [{ data, message }] : [],
  } satisfies DataUpdateEvent);
}

// async function registerFileProtocol(req: Request) {
//   const urlWithQueries = decodeURI(req.url).replace(
//     /nora:[/\\]{1,2}localFiles[/\\]{1,2}/gm,
//     ''
//   );

//   try {
//     const [url] = urlWithQueries.split('?');
//     const res = await net.fetch(url);
//     return res;
//   } catch (error) {
//     log(
//       `====== ERROR OCCURRED WHEN TRYING TO LOCATE A RESOURCE IN THE SYSTEM. =======\nREQUEST : ${urlWithQueries}\nERROR : ${error}`
//     );
//     return new Response('404', { status: 404 });
//   }
// }

function registerFileProtocol(
  request: { url: string },
  callback: (arg: string) => void,
) {
  const urlWithQueries = decodeURI(request.url).replace(
    /nora:[/\\]{1,2}localFiles[/\\]{1,2}/gm,
    '',
  );

  try {
    const [url] = urlWithQueries.split('?');
    return callback(url);
  } catch (error) {
    log(
      `====== ERROR OCCURRED WHEN TRYING TO LOCATE A RESOURCE IN THE SYSTEM. =======\nREQUEST : ${urlWithQueries}\nERROR : ${error}`,
    );
    return callback('404');
  }
}

export const setCurrentSongPath = (songPath: string) => {
  currentSongPath = songPath;
  savePendingSongLyrics(currentSongPath, false);
  savePendingMetadataUpdates(currentSongPath, true);
};

export const getCurrentSongPath = () => currentSongPath;

function manageAuthServices(url: string) {
  log('URL selected for auth service', { url });
  const { searchParams } = new URL(url);

  if (searchParams.has('service')) {
    if (searchParams.get('service') === 'lastfm') {
      const token = searchParams.get('token');
      if (token) return manageLastFmAuth(token);
    }
  }
  return undefined;
}

export async function showOpenDialog(
  openDialogOptions = DEFAULT_OPEN_DIALOG_OPTIONS,
) {
  const { canceled, filePaths } = await dialog.showOpenDialog(
    mainWindow,
    openDialogOptions,
  );

  if (canceled) {
    log('User cancelled the folder selection popup.');
    throw new Error('PROMPT_CLOSED_BEFORE_INPUT' as MessageCodes);
  }
  return filePaths;
}

export async function showSaveDialog(
  saveDialogOptions = DEFAULT_SAVE_DIALOG_OPTIONS,
) {
  const { canceled, filePath } = await dialog.showSaveDialog(
    mainWindow,
    saveDialogOptions,
  );

  if (canceled) {
    log('User cancelled the folder selection popup.');
    throw new Error('PROMPT_CLOSED_BEFORE_INPUT' as MessageCodes);
  }
  return filePath;
}

function manageAppMoveEvent() {
  const [x, y] = mainWindow.getPosition();
  log(
    `User moved the ${
      isMiniPlayer ? 'mini-player' : 'main window'
    } to (x: ${x}, y: ${y}) coordinates.`,
  );
  if (isMiniPlayer) saveUserData('windowPositions.miniPlayer', { x, y });
  else saveUserData('windowPositions.mainWindow', { x, y });
}

function manageAppResizeEvent() {
  const [x, y] = mainWindow.getSize();
  log(
    `User resized the ${
      isMiniPlayer ? 'mini-player' : 'main window'
    } to (x: ${x}, y: ${y}) diamensions.`,
  );
  if (isMiniPlayer) saveUserData('windowDiamensions.miniPlayer', { x, y });
  else saveUserData('windowDiamensions.mainWindow', { x, y });
}

async function handleSecondInstances(_: unknown, argv: string[]) {
  log('User requested for a second instance of the app.');
  if (app.hasSingleInstanceLock()) {
    if (mainWindow?.isMinimized()) mainWindow?.restore();
    mainWindow?.focus();
  }
  process.argv = argv;

  manageSecondInstanceArgs(argv);
  mainWindow?.webContents.send(
    'app/playSongFromUnknownSource',
    await checkForStartUpSongs(),
  );
}

function manageSecondInstanceArgs(args: string[]) {
  for (const arg of args) {
    if (arg.includes('nora://auth')) return manageAuthServices(arg);
  }
  return undefined;
}

export function restartApp(reason: string, noQuitEvents = false) {
  log(`REQUESTED A FULL APP REFRESH.\nREASON : ${reason}`);

  if (!noQuitEvents) {
    mainWindow.webContents.send('app/beforeQuitEvent');
    savePendingSongLyrics(currentSongPath, true);
    savePendingMetadataUpdates(currentSongPath, true);
    closeAllAbortControllers();
  }
  app.relaunch();
  app.exit(0);
}

async function revealSongInFileExplorer(songId: string) {
  const songs = getSongsData();

  for (let x = 0; x < songs.length; x += 1) {
    if (songs[x].songId === songId)
      return shell.showItemInFolder(songs[x].path);
  }
  return log(
    `Revealing song file in explorer failed because song couldn't be found in the library.`,
    { songId },
    'WARN',
    { sendToRenderer: { messageCode: 'SONG_REVEAL_FAILED' } },
  );
}

const songsOutsideLibraryData: SongOutsideLibraryData[] = [];

export const getSongsOutsideLibraryData = () => songsOutsideLibraryData;

export const addToSongsOutsideLibraryData = (data: SongOutsideLibraryData) =>
  songsOutsideLibraryData.push(data);

export const updateSongsOutsideLibraryData = (
  songidOrPath: string,
  data: SongOutsideLibraryData,
) => {
  for (let i = 0; i < songsOutsideLibraryData.length; i += 1) {
    if (
      songsOutsideLibraryData[i].path === songidOrPath ||
      songsOutsideLibraryData[i].songId === songidOrPath
    ) {
      songsOutsideLibraryData[i] = data;
      return undefined;
    }
  }
  log(
    `songIdOrPath ${songidOrPath} does't exist on songsOutsideLibraryData.`,
    undefined,
    'ERROR',
  );
  throw new Error(
    `songIdOrPath ${songidOrPath} does't exist on songsOutsideLibraryData.`,
  );
};

async function getImagefileLocation() {
  const filePaths = await showOpenDialog({
    title: 'Select an Image',
    buttonLabel: 'Select Image',
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'webp', 'png'] }],
    properties: ['openFile'],
  });
  return filePaths[0];
}

async function getFolderLocation() {
  const folderPaths = await showOpenDialog({
    title: 'Select a Folder',
    buttonLabel: 'Select Folder',
    properties: ['createDirectory', 'openDirectory'],
  });
  return folderPaths[0];
}

async function resetApp(isRestartApp = true) {
  log('!-!-!-!-!-!  STARTED THE RESETTING PROCESS OF THE APP.  !-!-!-!-!-!');
  try {
    await mainWindow.webContents.session.clearStorageData();
    resetAppCache();
    await resetAppData();
    log(
      `########## SUCCESSFULLY RESETTED THE APP. RESTARTING THE APP NOW. ##########`,
    );
    sendMessageToRenderer({ messageCode: 'RESET_SUCCESSFUL' });
  } catch (error) {
    sendMessageToRenderer({ messageCode: 'RESET_FAILED' });
    log(
      `====== ERROR OCCURRED WHEN RESETTING THE APP. RELOADING THE APP NOW.  ======\nERROR : ${error}`,
    );
  } finally {
    log(`====== RELOADING THE ${isRestartApp ? 'APP' : 'RENDERER'} ======`);
    if (isRestartApp) restartApp('App resetted.');
    else mainWindow.webContents.reload();
  }
}

function toggleMiniPlayerAlwaysOnTop(isMiniPlayerAlwaysOnTop: boolean) {
  if (mainWindow) {
    if (isMiniPlayer) mainWindow.setAlwaysOnTop(isMiniPlayerAlwaysOnTop);
    saveUserData(
      'preferences.isMiniPlayerAlwaysOnTop',
      isMiniPlayerAlwaysOnTop,
    );
  }
}

async function getRendererLogs(
  mes: string | Error,
  data?: Record<string, unknown>,
  messageType: LogMessageTypes = 'INFO',
  forceWindowRestart = false,
  forceMainRestart = false,
) {
  log(mes, data, messageType, undefined, 'UI');

  if (forceWindowRestart) return mainWindow.reload();
  if (forceMainRestart) {
    app.relaunch();
    return app.exit();
  }
  return undefined;
}

function recordWindowState(state: WindowState) {
  log(`Window state changed`, { state });
  setUserData('windowState', state);
}

function restartRenderer() {
  mainWindow.webContents.send('app/beforeQuitEvent');
  mainWindow.reload();
  if (isMiniPlayer) {
    toggleMiniPlayer(false);
    log('APP TOGGLED BACK TO THE MAIN WINDOW DUE TO AN APP REFRESH.');
  }
}

function watchForSystemThemeChanges() {
  // This event only occurs when system theme changes
  const userData = getUserData();
  const { useSystemTheme } = userData.theme;

  const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  if (IS_DEVELOPMENT && useSystemTheme)
    sendMessageToRenderer({ messageCode: 'APP_THEME_CHANGE', data: { theme } });

  if (useSystemTheme) changeAppTheme('system');
  else log(`System theme changed to ${theme}`);
}

function toggleMiniPlayer(isActivateMiniPlayer: boolean) {
  if (mainWindow) {
    log(
      `Toggled the mini-player to be ${
        isActivateMiniPlayer ? 'enabled' : 'disabled'
      }.`,
    );
    isMiniPlayer = isActivateMiniPlayer;
    const { windowPositions, windowDiamensions, preferences } = getUserData();
    if (isActivateMiniPlayer) {
      if (mainWindow.fullScreen) mainWindow.setFullScreen(false);

      mainWindow.setMaximumSize(MINI_PLAYER_MAX_SIZE_X, MINI_PLAYER_MAX_SIZE_Y);
      mainWindow.setMinimumSize(MINI_PLAYER_MIN_SIZE_X, MINI_PLAYER_MIN_SIZE_Y);
      mainWindow.setAlwaysOnTop(preferences.isMiniPlayerAlwaysOnTop ?? false);
      if (windowDiamensions.miniPlayer) {
        const { x, y } = windowDiamensions.miniPlayer;
        mainWindow.setSize(x, y, true);
      } else
        mainWindow.setSize(
          MINI_PLAYER_MIN_SIZE_X,
          MINI_PLAYER_MIN_SIZE_Y,
          true,
        );
      if (windowPositions.miniPlayer) {
        const { x, y } = windowPositions.miniPlayer;
        mainWindow.setPosition(x, y, true);
      } else {
        mainWindow.center();
        const [x, y] = mainWindow.getPosition();
        saveUserData('windowPositions.miniPlayer', { x, y });
      }
      mainWindow.setAspectRatio(MINI_PLAYER_ASPECT_RATIO);
    } else {
      mainWindow.setMaximumSize(MAIN_WINDOW_MAX_SIZE_X, MAIN_WINDOW_MAX_SIZE_Y);
      mainWindow.setMinimumSize(MAIN_WINDOW_MIN_SIZE_X, MAIN_WINDOW_MIN_SIZE_Y);
      mainWindow.setAlwaysOnTop(false);
      if (windowDiamensions.mainWindow) {
        const { x, y } = windowDiamensions.mainWindow;
        mainWindow.setSize(x, y, true);
      } else
        mainWindow.setSize(
          MAIN_WINDOW_DEFAULT_SIZE_X,
          MAIN_WINDOW_DEFAULT_SIZE_Y,
          true,
        );
      if (windowPositions.mainWindow) {
        const { x, y } = windowPositions.mainWindow;
        mainWindow.setPosition(x, y, true);
      } else {
        mainWindow.center();
        const [x, y] = mainWindow.getPosition();
        saveUserData('windowPositions.mainWindow', { x, y });
      }
      mainWindow.setAspectRatio(MAIN_WINDOW_ASPECT_RATIO);
    }
  }
}

async function toggleAutoLaunch(autoLaunchState: boolean) {
  const options = app.getLoginItemSettings();
  const userData = getUserData();
  const openAsHidden =
    userData?.preferences?.openWindowAsHiddenOnSystemStart ?? false;

  log(`AUTO LAUNCH STATE : ${options.openAtLogin}`);

  app.setLoginItemSettings({
    openAtLogin: autoLaunchState,
    name: 'CaesarAIMusic',
    openAsHidden,
  });

  saveUserData('preferences.autoLaunchApp', autoLaunchState);
}

export const checkIfConnectedToInternet = () => net.isOnline();
