# QA AUDIT v1.4.1

## Automated checks
- 23/23 pytest tests passed.
- Python modules compile successfully.
- All JSON files in the repository parse successfully.
- CLI package mode (`python -m src.research_cli`) verified for help, Quran search, claims, and score commands.

## Bugs found and fixed
1. `research_cli.py` referenced the raw Quran witness instead of the normalized corpus. Fixed.
2. Quran corpus tests referenced the raw corpus after normalization. Fixed to validate normalized corpus.
3. `interpretation_gap` semantics were ambiguous. It is now documented as points awarded for a LOW interpretation gap; higher points are better.
4. Raw-vs-normalized Quran status is explicitly separated in run metadata.

## Intentional pending items
- Full hadith corpus ingestion remains pending external file/network access.
- Torah, Psalms, and Gospel primary corpora remain external-register-only until local ingestion.
- Manuscript dating is not treated as proof of divine origin.
