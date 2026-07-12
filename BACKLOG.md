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

**Versions belong to their author.** You cannot edit or delete someone else's
words. The database refuses, not just the UI.

**Saves are private by default.** May become a toggle — see below.

---

## Deferred

### Suggested edits / challenges
Anyone can **question or challenge** a title, Roud number, or origin, and
propose a correction. Not a direct edit — a suggestion that someone reviews.

This is the release valve for locked titles. It keeps the catalogue stable
while still letting the crowd fix what's wrong, and it means the argument about
whether a song is really *Died for Love* happens in the open, which in folk is
half the fun.

Schema sketch: an `edit_suggestions` table — target table + row + field,
proposed value, reason, proposer, status (open / accepted / rejected).

### Roud number backfill
Most songs have no Roud number. Claude can work through the catalogue and
suggest them — from knowledge where it's confident, from the Vaughan Williams
Memorial Library index where it isn't.

**Two guardrails, both important:**
- Anything auto-added is marked **suggested, not confirmed**, until a human
  eyeballs it. Add a `roud_confirmed` boolean. A *wrong* Roud number is worse
  than a missing one, because duplicate detection treats Roud as definitive —
  a bad number would confidently merge two unrelated songs.
- **A blank is often correct.** Roud covers traditional song. Stan Rogers'
  *Northwest Passage* has no Roud number and never will. Don't fill gaps that
  aren't gaps.

Do this as a batch job *after* the import, not by hand.

### Duplicate detection on add
The hard, important one. When someone adds a song, work out whether it already
exists — and if so, offer to add their words as a **version** rather than
creating a duplicate song.

**A ladder, tried in order:**

1. **Roud match** -> same song. Definitive when present.
2. **A rare five-word run matches an existing lyric** -> almost certainly the
   same song. This is the strongest signal in practice. A run of five
   consecutive words is nearly a fingerprint: *"as I roved out one morning"* is
   too common to mean anything, but *"martin said to his man"* appears in one
   song on earth. Weight each phrase by how rare it is across the corpus
   (TF-IDF); the rare n-grams do the identifying.
3. **Fuzzy title or alt-title match** (`pg_trgm`, installed; trigram index on
   `title`) -> maybe. Catches "Barb'ry Allen" vs "Barbara Allen". Completely
   misses "Died for Love" vs "The Butcher Boy" — hence step 2.
4. **Nothing** -> new song.

**It always asks. It never merges silently.** "This looks like it might be
*Who's the Fool Now* — is it?" When it's wrong it will be confidently wrong,
and a human who knows the song spots it in half a second.

An LLM call earns its place at steps 2-3: hand it the candidates and the new
lyrics and ask "same song?"

Cannot be built or tested against an empty database. Do it after the import.

### Public/private saves toggle
Saves are private, full stop, today. Make it user-toggleable — "three other
people are learning this" is real social glue, and knowing who else sings a
song is how you find someone to teach it to you.

Schema: add `visibility` to `saves` ('private' | 'public'); loosen the select
policy to `auth.uid() = person_id OR visibility = 'public'`. **Private stays
the default.**

### Contact between singers
Let a singer opt in to being contactable, so you can ask "where did you get
that version?"

**Never expose email addresses.** An opt-in `contactable` boolean on `profiles`
plus an in-app relay — not a column with someone's address in it that every
user can read.

### Filling in missing lyrics
Claude finding and adding lyrics for songs that have none. Archie is open to it.

**Copyright caveat, and it's real.** Traditional folk is largely public domain,
which is why the current catalogue is safe. The pub sing log already contains
Stan Rogers, Terry Anderson, Craig Johnson — living or recent writers whose
words are somebody's property. The moment the app hosts in-copyright lyrics,
Archie is the one hosting them. Needs a policy and a takedown route before
signups open. Worth actual legal advice. Do not bulk-import from lyrics sites.

### Retiring the Google Sheet
The catalogue sheet is imported once as seed data, then retired. After the
import, this fork stops tracking Dylan's catalogue and becomes its own thing.
Dylan's Google Form is replaced by an in-app "add a song" flow, and the
hardcoded form link in `MainLayout.vue` comes out.

### Licence
`dylbrown/songbook` has no LICENSE file, which technically means all rights
reserved. Dylan has verbally invited forking. Ask him to add one (MIT is the
standard "do what you like" licence) so the position is written down rather
than living in a chat message.

---

## Explicitly not doing

**Self-check-in at the sing.** ("Tap 'I sang this' when you sing it.")
Considered and rejected. Nobody takes out a phone at a pub sing, and the whole
appeal is a room full of people not looking at phones. The friction is fatal,
and it solves a problem only Dylan has.

**Publishing the recordings.** Dylan records every sing. A wonderful archive and
emphatically out of scope: performer consent, and copyright on anything not
traditional. Ask him what he wants to happen to it. Not this app.
