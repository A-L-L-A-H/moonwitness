# Taurat Corpus Policy

## Role

`TAURAT` is a supplementary source category. The current working textual witness is the Torah/Pentateuch corpus.

## Modeling rule

The engine must not silently assert:

`TAURAT = every text in the Old Testament`.

Instead it stores:

`TAURAT source category → Torah/Pentateuch textual witness → book/chapter/verse`.

## Typical uses

- supplement a trait not explicit in the Qur'an;
- compare genealogical or narrative detail;
- expose a source difference without harmonizing it;
- support historical name-language analysis when appropriately qualified.

## Required metadata

- witness corpus;
- book name;
- chapter/verse;
- edition/translation identifier when text is quoted;
- identity binding and confidence;
- relation to Qur'anic claim.

## Example guardrail

Genesis 22 may be represented as a Taurat textual witness naming Isaac in the binding narrative. QS 37:102–107 remains represented according to its own wording, where the son is not named in the Arabic text. The engine preserves both statements and does not overwrite either one.
