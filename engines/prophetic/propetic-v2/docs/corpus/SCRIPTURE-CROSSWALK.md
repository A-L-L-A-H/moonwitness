# Scripture Crosswalk

| Source ID | Project category | Current witness layer | Reference scheme | Priority |
|---|---|---|---|---:|
| `quran` | Al-Qur'an | Qur'anic text/reference corpus | `surah:ayah` | 1 |
| `taurat` | Taurat | Torah/Pentateuch textual witness | `book chapter:verse` | 2 |
| `zabur` | Zabur | Psalms textual witness | `psalm:verse` | 3 |
| `injil` | Injil | Gospel textual witness | `gospel chapter:verse` | 4 |

## Identity crosswalk

Prophet-name crosswalks are explicit data edges with confidence. They are not inferred merely from similar spelling.

Examples of high-confidence traditional/historical bindings may include Musa↔Moses, Dawud↔David, Zakariya↔Zechariah, and Yahya↔John. Debated bindings such as Idris↔Enoch must remain lower-confidence and must not be auto-merged.

## Reference normalization

Every citation object should normalize:

- `source_id`
- `work`
- `chapter_or_psalm`
- `verse_start`
- `verse_end`
- `display_ref`
- `edition_id` when textual wording is material.
