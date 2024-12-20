import { marked } from 'marked';
import type { Song } from 'src/components/models';

let songs_promise: Promise<Song[]> | null = null;

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
/* function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
} */

export async function getSongs(): Promise<Song[]> {
  if (songs_promise != null) return songs_promise;
  songs_promise = fetch(
    'https://docs.google.com/spreadsheets/d/19_AunvMQBWfs3G91r23vIwdEyqy4g9r2p5I7zGPfWvc/gviz/tq?tqx=out:json&sheet=Responses',
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch spreadsheet!');
      }
      return res.text();
    })
    .then((text) => {
      return JSON.parse(text.substring(47, text.length - 2));
    })
    .then(async (songs_sheet) => {
      const songs: Song[] = [];
      for (const row_obj of songs_sheet.table.rows) {
        const row = row_obj.c;
        const song: Song = {
          name: get(row, 1),
          alt: makeList(get(row, 2)),
          roud: Number(get(row, 3)),
          singers: makeList(get(row, 13)),
          date: get(row, 0),
          composer: get(row, 4),
          unaccompanied:
            row[5] == null || get(row, 5).includes('Unaccompanied'),
          accompanied: row[5] == null || get(row, 5).includes('Accompanied'),
          refrain: get(row, 6),
          themes: makeList(get(row, 7), '[,;]'),
          categories: makeList(get(row, 8), '[,;]'),
          happiness: Number(get(row, 9)),
          reference: get(row, 10),
          lyrics: get(row, 11),
          info: get(row, 15),
        };
        if (song.info) song.info = await marked.parse(song.info.trim());
        songs.push(song);
      }
      // shuffleArray(songs);
      return songs;
    });
  return songs_promise;
}

function makeList(value: string | null, separator = ';') {
  if (value == null) return [];
  return value
    .split(new RegExp(' *' + separator + ' *'))
    .filter((s) => s.trim().length > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(row: any[], i: number): string {
  const item = row[i];
  if (item == null) return '';
  if (item.f != null) return item.f;
  return item.v;
}
