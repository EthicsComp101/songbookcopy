# Folkbook — decisions and backlog

Deliberate choices and deferred work. Lives in the repo root.
When something gets built, move it out of Deferred and into Done.

---

## The shape of the thing

A shared folk song catalogue where **the version is the object, not the song.**

Bevan's *Thousands or More* is not Jon's. The words differ, the verses differ,
someone dropped a verse and someone's grandmother added one. A songbook that
stores one canonical lyric per song has thrown away the interesting part.

Core loop: you hear a song at the Monday sing -> you get home -> you search a
half-remembered line -> you find *that singer's* version -> you save it to learn.

Not a capture tool. Nobody takes out a phone at a pub sing, and they shouldn't.

**Why this matters, from the data:** across 26 nights and 1,136 performances,
only **12%** of songs were ever picked up by a second singer. The ones that
spread are all shanties and big-chorus numbers — *The Wild Rover*, *Haul Away
Joe*, *Wild Mountain Thyme* — i.e. the songs you can learn **by ear, in one
hearing**. The long ballad stays locked in one person's repertoire forever,
because there is no mechanism to get it out. Folkbook widens the bandwidth of
transmission. That is the whole argument for it.

---

## Done

- **Forked** to `EthicsComp101/songbookcopy`. Runs locally on Node 20 / Yarn 4.
- **Lyrics search.** The filter in `SongTable.vue` now matches `row.lyrics` as
  well as title, alt titles and themes. Searching "martin said" finds
  *Who's the Fool Now*.
- **Supabase project** (free tier), schema applied, RLS on all four tables.
- **379 songs imported** from Dylan's catalogue sheet, each with its lyrics as a
  first version (`added_by` null — Dylan has no account). Dates backfilled from
  the sheet's original submission timestamps.
- **App reads from Supabase**, not the gviz endpoint. Front end unchanged.
- **Auth.** Magic links, no passwords. Session survives refresh. Profile page
  for setting a display name (the name that appears on your versions).
- **Add a Song** page at `/add`. Signed-in only. Writes a `songs` row *and* a
  `versions` row atomically via the `add_song` Postgres function
  (`SECURITY INVOKER`, so RLS still applies; `auth.uid()` stamps `created_by`
  and `added_by` server-side so the client cannot claim an identity).
- **Google Form link removed** from `MainLayout.vue`. It submitted to Dylan's
  spreadsheet, which we no longer read — anything added through it would have
  vanished from Folkbook and polluted his live catalogue instead.

---

## Decided

**Saves point at a version, not a song.** "Learn later" means learn Bevan's,
specifically. This is load-bearing.

**Search matches lyrics, not just titles.** Folk songs are the worst case for
title search — the same song is *Died for Love* and *Butcher Boy* and *A Brisk
Young Sailor*. Alternate titles are first-class.

**Song titles are locked.** Anyone signed in can add alternate titles, fix a
Roud number, add themes — but not rewrite the main title. Enforced with
column-level grants, not a missing button.

**Songs cannot be deleted.** No delete policy on `songs` — they're shared
property. (This is what forced `add_song` to be a Postgres function: the app
can't compensate for a half-failed insert by deleting, so the two inserts have
to be one transaction.)

**Versions belong to their author.** You cannot edit or delete someone else's
words. The database refuses, not just the UI.

**Saves are private by default.** May become a toggle — see below.

**Keys.** `SUPABASE_SECRET_KEY` deliberately has no `VITE_` prefix — Vite ships
any `VITE_`-prefixed variable to the browser bundle. The secret key is for
one-off local scripts only. The app uses the publishable key and nothing else.

---

## Deferred

### `getSongs()` caches for the app's lifetime
`load-table.ts` fetches every song once and holds it forever, so anything added
or changed since page load is invisible. The Add a Song page works around this
with a full page reload on success.

Fine at 379 songs and one user. Needs proper cache invalidation — or a Pinia
store as the source of truth — before this is a real multi-user app. Will bite
again as soon as saves exist.

### Duplicate detection on add
The hard, important one, and it is now **live** — nothing currently stops
someone creating a second *Barbara Allen*.

When someone adds a song, work out whether it already exists — and if so, offer
to add their words as a **version** rather than creating a duplicate song.

**A ladder, tried in order:**

1. **Roud match** -> same song. Definitive when present.
2. **A rare five-word run matches an existing lyric** -> almost certainly the
   same song. The strongest signal in practice. A run of five consecutive words
   is nearly a fingerprint: *"as I roved out one morning"* is too common to mean
   anything, but *"martin said to his man"* appears in one song on earth. Weight
   each phrase by how rare it is across the corpus (TF-IDF); the rare n-grams do
   the identifying.
3. **Fuzzy title or alt-title match** (`pg_trgm` installed; trigram index on
   `title`) -> maybe. Catches "Barb'ry Allen" vs "Barbara Allen". Completely
   misses "Died for Love" vs "The Butcher Boy" — hence step 2.
4. **Nothing** -> new song.

**It always asks. It never merges silently.** "This looks like it might be
*Who's the Fool Now* — is it?" When it's wrong it will be confidently wrong, and
a human who knows the song spots it in half a second.

An LLM call earns its place at steps 2-3: hand it the candidates and the new
lyrics and ask "same song?"

### Save to learn
The feature the whole thing is for. A button on each **version**. Saved things
go on a list — probably two: *learning* and *know it*.

The `saves` table and its RLS already exist and are verified private.

### The song page
Currently `/lyrics/:song_name` shows one set of lyrics. It needs to show **every
version**, each with its author's display name, source and notes — and a save
button on each. This is where the versions model finally becomes visible to the
user, and right now it isn't.

### Suggested edits / challenges
Anyone can **question or challenge** a title, Roud number, or origin, and
propose a correction. Not a direct edit — a suggestion someone reviews.

The release valve for locked titles. Keeps the catalogue stable while still
letting the crowd fix what's wrong, and it means the argument about whether a
song is really *Died for Love* happens in the open, which in folk is half the
fun.

Schema sketch: an `edit_suggestions` table — target table + row + field,
proposed value, reason, proposer, status (open / accepted / rejected).

### Roud number backfill
Most songs have no Roud number. Claude can work through the catalogue and
suggest them — from knowledge where confident, from the Vaughan Williams
Memorial Library index where not.

**Two guardrails:**
- Anything auto-added is marked **suggested, not confirmed**, until a human
  eyeballs it. Add a `roud_confirmed` boolean. A *wrong* Roud number is worse
  than a missing one, because duplicate detection treats Roud as definitive —
  a bad number would confidently merge two unrelated songs.
- **A blank is often correct.** Roud covers traditional song. Stan Rogers'
  *Northwest Passage* has no Roud number and never will.

Only worth doing once duplicate detection exists to use it.

### Dylan's idiosyncratic fields
`happiness` (1-5), `purposes`, and `singers` are Dylan's taste and his club's
shorthand, not universal facts about songs. `add_song` doesn't set them.

**Consequence, and it will confuse someone:** songs added through the form have
no happiness rating, and the happiness filter *skips* songs rated 0 — so a
singer with that filter on will add a song and then be unable to find it.

Decide whether these fields survive at all. If they do, the filter needs to stop
hiding unrated songs.

### Composer needs a "Traditional" option
`composer` is free text today, so it will accumulate "Trad", "trad.",
"Traditional", "Anon", "Unknown", "?" — several spellings of two different ideas.

**Three states are being conflated, and they're genuinely distinct:**
- **Traditional** — nobody wrote it, and that *is* the answer. A positive claim,
  not a gap.
- **Unknown** — somebody wrote it, we don't know who. Genuinely missing.
- **Blank** — nobody's got round to filling it in yet.

Probably a `composer_type` enum ('traditional' | 'known' | 'unknown') alongside
the free-text `composer`, with a "Traditional — no known composer" option in the
Add a Song form.

**Connects to the Roud backfill:** traditional songs are precisely the ones that
*have* Roud numbers. Stan Rogers doesn't. Knowing which songs are traditional
tells the Roud job which ones are even worth looking up.

### Edit your own submissions
Let people edit and delete their own versions from the UI — lyrics, notes, source.

**The permissions already exist.** The RLS policies ("you can edit your own
versions", "you can delete your own versions") were written with the schema and
are enforced by the database. This is a UI job, not a security one.

**The awkward bit: titles.** Song titles are locked by column-level grant, and
that lock applies to the person who *created* the song too. So if you typo a
title when adding a song, you can't fix it — someone has to go into the Supabase
dashboard by hand.

Options:
- Let `created_by` edit the title for a grace period (an hour? until someone else
  adds a version?), after which it locks.
- Or route it through the suggested-edits system and accept the friction.

Leaning towards the grace period. **A typo caught thirty seconds later is not the
same act as renaming a song other people have already saved**, and treating them
identically is what makes locked titles feel bureaucratic rather than protective.

### Public/private saves toggle
Saves are private, full stop, today. Make it user-toggleable — "three other
people are learning this" is real social glue, and knowing who else sings a song
is how you find someone to teach it to you.

Schema: add `visibility` to `saves` ('private' | 'public'); loosen the select
policy to `auth.uid() = person_id OR visibility = 'public'`. **Private stays the
default.**

### Contact between singers
Let a singer opt in to being contactable, so you can ask "where did you get that
version?"

**Never expose email addresses.** An opt-in `contactable` boolean on `profiles`
plus an in-app relay — not a column with someone's address in it that every user
can read.

### Filling in missing lyrics
Claude finding and adding lyrics for songs that have none. Archie is open to it.

**Copyright caveat, and it's real.** Traditional folk is largely public domain,
which is why the current catalogue is safe. The pub sing log already contains
Stan Rogers, Terry Anderson, Craig Johnson — living or recent writers whose
words are somebody's property. The moment the app hosts in-copyright lyrics,
Archie is the one hosting them. Needs a policy and a takedown route before
signups open. Worth actual legal advice. Do not bulk-import from lyrics sites.

### Backups
The Supabase free tier has **no automatic backups**. Once singers are typing
their own notes and lyrics into this, that's their work, and you owe them a
backup. Can be done for free; needs setting up.

### Deployment
Still local-only. Netlify (what Dylan uses) stays free. Needs a domain (~$15/yr),
and the Supabase redirect URLs updating from `localhost:9000` to the real one —
easy to forget, and auth will break silently without it.

### Licence
`dylbrown/songbook` has no LICENSE file, which technically means all rights
reserved. Dylan has verbally agreed ("For sure!") over Telegram. Ask him to add
one (MIT is the standard "do what you like" licence) so the position is written
down rather than living in a chat thread.

---

## Explicitly not doing

**Self-check-in at the sing.** ("Tap 'I sang this' when you sing it.")
Considered and rejected. Nobody takes out a phone at a pub sing, and the whole
appeal is a room full of people not looking at phones. The friction is fatal,
and it solves a problem only Dylan has.

**Publishing the recordings.** Dylan records every sing. A wonderful archive and
emphatically out of scope: performer consent, and copyright on anything not
traditional. Ask him what he wants to happen to it. Not this app.

**Lyrics as files rather than database rows.** Suggested (reasonably) as a way to
save database quota. But the maths says it's a non-problem — 379 songs is about
1MB, 0.2% of the free tier — and it would break the two best features: lyrics
search and n-gram duplicate detection. Postgres cannot index what it cannot see.
Files are the right answer for *audio*, which is genuinely enormous. Not for text.
