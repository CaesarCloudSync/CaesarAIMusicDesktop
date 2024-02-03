import { TagConstants } from 'node-id3';
import log from '../log';

const convertParsedLyricsToNodeID3Format = (
  parsedLyrics?: LyricsData,
  prevSyncedLyrics: SynchronisedLyrics = [],
): SynchronisedLyrics => {
  try {
    if (parsedLyrics && parsedLyrics.isSynced && parsedLyrics.syncedLyrics) {
      const { syncedLyrics, copyright } = parsedLyrics;
      const synchronisedText = syncedLyrics.map((line) => {
        const text =
          typeof line.text === 'string'
            ? line.text
            : line.text.map((x) => x.unparsedText).join(' ');

        return {
          text,
          // to convert seconds to milliseconds
          timeStamp: Math.round(line.start * 1000),
        };
      });
      // lyrics metadata like copyright info is stored on the shortText.

      const shortText = copyright ? JSON.stringify({ copyright }) : undefined;

      const convertedLyrics = [
        ...prevSyncedLyrics,
        {
          contentType: TagConstants.SynchronisedLyrics.ContentType.LYRICS,
          timeStampFormat: TagConstants.TimeStampFormat.MILLISECONDS,
          language: 'ENG',
          shortText,
          synchronisedText,
        },
      ] satisfies SynchronisedLyrics;
      return convertedLyrics;
    }
    return prevSyncedLyrics;
  } catch (error) {
    log(
      `Error occurred when converting parsed lyrics to NodeID3 Synchronised Lyrics format.`,
      { error },
      'WARN',
    );
    return prevSyncedLyrics;
  }
};

export default convertParsedLyricsToNodeID3Format;
