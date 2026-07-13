/**
 * One-off: backfill songs.created_at (and versions.created_at) with the
 * original submission timestamps from the Google Sheet. The initial import
 * left them at now(), which would make every song's "Date Added" the import
 * day.
 *
 * Matching: the import inserted rows sequentially in sheet order, so DB rows
 * ordered by created_at correspond 1:1 to titled sheet rows. Every pair is
 * title-asserted before any write; aborts on the first mismatch.
 *
 * Run with: yarn dlx tsx scripts/backfill-dates.ts
 */
import { createClient } from '@supabase/supabase-js';

process.loadEnvFile(new URL('../.env', import.meta.url).pathname);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(row: any[], i: number): string {
  const item = row[i];
  if (item == null) return '';
  if (item.f != null) return item.f;
  return item.v;
}

// Same parsing as load-table.ts: "DD/MM/YYYY HH:MM:SS", local time.
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
    (date[1] ?? 1) - 1,
    date[0] ?? 0,
    time[0] ?? 0,
    time[1] ?? 0,
    time[2] ?? 0,
  );
}

async function main() {
  const res = await fetch(
    'https://docs.google.com/spreadsheets/d/19_AunvMQBWfs3G91r23vIwdEyqy4g9r2p5I7zGPfWvc/gviz/tq?tqx=out:json&sheet=Responses',
  );
  if (!res.ok) throw new Error('Failed to fetch spreadsheet: ' + res.status);
  const text = await res.text();
  const sheet = JSON.parse(text.substring(47, text.length - 2));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheetRows = sheet.table.rows
    .map((r: { c: any[] }) => ({
      title: get(r.c, 0).trim(),
      date: get(r.c, 1).trim(),
    }))
    .filter((r: { title: string }) => r.title !== '');

  const { data: dbSongs, error } = await supabase
    .from('songs')
    .select('id, title, created_at')
    .order('created_at', { ascending: true })
    .limit(1000);
  if (error) throw new Error('fetch songs failed: ' + error.message);

  if (dbSongs.length !== sheetRows.length) {
    throw new Error(
      `Row count mismatch: DB has ${dbSongs.length}, sheet has ${sheetRows.length} titled rows. Aborting.`,
    );
  }

  const pairs: { db: (typeof dbSongs)[number]; sheet: { title: string; date: string } }[] = [];
  for (let i = 0; i < dbSongs.length; i++) {
    const db = dbSongs[i];
    const sheetRow = sheetRows[i];
    if (db == null || sheetRow == null) throw new Error('Impossible: index out of range');
    // Assert the full pairing before touching anything.
    if (db.title !== sheetRow.title) {
      throw new Error(
        `Order mismatch at index ${i}: DB "${db.title}" vs sheet "${sheetRow.title}". Aborting with no writes.`,
      );
    }
    pairs.push({ db, sheet: sheetRow });
  }
  console.log(`All ${pairs.length} titles pair up in order. Backfilling...`);

  let updated = 0;
  const failed: string[] = [];
  for (const { db, sheet: sheetRow } of pairs) {
    const ts = parseDate(sheetRow.date).toISOString();
    const { error: songErr } = await supabase
      .from('songs')
      .update({ created_at: ts })
      .eq('id', db.id);
    const { error: verErr } = await supabase
      .from('versions')
      .update({ created_at: ts })
      .eq('song_id', db.id);
    if (songErr || verErr) {
      failed.push(`${db.title}: ${songErr?.message ?? verErr?.message}`);
    } else {
      updated++;
    }
  }

  console.log('--- Backfill summary ---');
  console.log('Songs updated: ' + updated + '/' + dbSongs.length);
  for (const f of failed) console.log('  failed - ' + f);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
