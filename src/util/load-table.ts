import type { Song } from 'src/components/models';
import { capitalize } from 'vue';

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
          name: get(row, 0),
          alt: makeList(get(row, 2)),
          roud: Number(get(row, 3)),
          singers: makeList(get(row, 13)),
          date: parseDate(get(row, 1).trim()),
          composer: get(row, 4),
          unaccompanied:
            row[5] == null || get(row, 5).includes('Unaccompanied'),
          accompanied: row[5] == null || get(row, 5).includes('Accompanied'),
          refrain: get(row, 6),
          themes: sanitize(makeList(get(row, 7), '[,;]')),
          categories: sanitize(makeList(get(row, 8), '[,;]')),
          purposes: sanitize(makeList(get(row, 16), '[,;]')),
          happiness: Number(get(row, 9)),
          reference: get(row, 10),
          lyrics: get(row, 11),
          info: get(row, 15),
        };
        songs.push(song);
      }
      // shuffleArray(songs);
      return songs;
    });
  return songs_promise;
}

function sanitize(strings: Array<string>) {
  return strings.map((s) => capitalize(s));
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
function parseDate(dateTime: string): Date {
  const space = dateTime.indexOf(' ');
  const date = dateTime
    .substring(0, space)
    .split('/')
    .map((s) => parseInt(s));
  const time = dateTime
    .substring(space + 1)
    .split(':')
    .map((s) => parseInt(s));

  return new Date(
    date[2] ?? 0,
    date[1] ?? 0,
    date[0] ?? 0,
    time[0] ?? 0,
    time[1] ?? 0,
    time[2] ?? 0,
  );
}
