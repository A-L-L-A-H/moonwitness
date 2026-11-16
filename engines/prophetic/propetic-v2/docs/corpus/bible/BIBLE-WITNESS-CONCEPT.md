# Bible Witness Concept

## Why this document exists

The word **Bible** is useful as a modern library/container label, but it is **not a fifth revelation source ID** in Prophet Research Engine v2.1.

The engine source registry remains exactly:

1. `quran`
2. `taurat`
3. `zabur`
4. `injil`

## Container vs revelation source

The engine may encounter extant textual witnesses that today are printed inside a Bible. Their modern container does not determine the engine's revelation-source category.

Examples:

- Pentateuch/Torah passages are attached to the `taurat` witness layer.
- Psalms passages are attached to the `zabur` witness layer with attribution metadata.
- Gospel passages are attached to the `injil` witness layer.
- Other Biblical books are **not automatically imported** merely because they appear in a Bible.

Therefore:

`BIBLE = modern textual-library/container concept`

while:

`TAURAT / ZABUR / INJIL = project revelation-source categories with explicitly approved witness corpora`.

## Why the separation matters

Without this separation the model could accidentally assert any of the following:

- Taurat equals the entire Old Testament;
- Zabur equals every Biblical poetic book;
- Injil equals the entire New Testament;
- the boundaries of a later canon are identical to the boundaries of the original revelations.

v2.1 makes none of those claims.

## Ingestion rule

A future textual-witness file can enter the engine only if it declares:

- one approved `source_id`;
- work/book identifier;
- edition/version;
- language/script;
- passage reference scheme;
- checksum when raw text is ingested;
- attribution/binding confidence where needed.

If no approved mapping exists, the text remains outside the core research corpus until reviewed.
