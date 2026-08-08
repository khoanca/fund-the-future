#!/usr/bin/env python3
"""Extract I18N_VI dictionary from index.html and output as clean JSON."""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INPUT = ROOT / "index.html"
OUTPUT = Path(__file__).resolve().parent / "i18n-vi.json"


def extract_i18n(html: str) -> dict[str, str]:
    match = re.search(r"var I18N_VI\s*=\s*\{", html)
    if not match:
        raise SystemExit("ERROR: I18N_VI object not found in index.html")

    start = match.end()
    brace_count = 1
    pos = start
    while pos < len(html) and brace_count > 0:
        ch = html[pos]
        if ch in "({[":
            brace_count += 1
        elif ch in ")}]":
            brace_count -= 1
        pos += 1

    body = html[start : pos - 1]

    key_re = re.compile(r"""(['"])([^'\\]*(?:\\.[^'\\]*)*)\1""")
    result: dict[str, str] = {}
    pos2 = 0

    while pos2 < len(body):
        m_skip = re.match(r"\s*,?\s*", body[pos2:])
        if m_skip:
            pos2 += m_skip.end()
            if pos2 >= len(body):
                break

        m_key = key_re.match(body[pos2:])
        if not m_key:
            pos2 += 1
            continue

        key = m_key.group(2)
        pos2 += m_key.end()

        m_col = re.match(r"\s*:\s*", body[pos2:])
        if not m_col:
            break
        pos2 += m_col.end()

        if body[pos2] in ("'", '"'):
            quote = body[pos2]
            val = ""
            pos2 += 1
            while pos2 < len(body):
                ch = body[pos2]
                if ch == "\\":
                    if pos2 + 1 < len(body):
                        val += ch + body[pos2 + 1]
                        pos2 += 2
                        continue
                if ch == quote:
                    pos2 += 1
                    break
                val += ch
                pos2 += 1
            val_decoded = val.replace("\\'", "'")
            result[key] = val_decoded
        elif body[pos2] == "`":
            val = ""
            pos2 += 1
            while pos2 < len(body):
                ch = body[pos2]
                if ch == "\\":
                    if pos2 + 1 < len(body):
                        val += ch + body[pos2 + 1]
                        pos2 += 2
                        continue
                if ch == "`":
                    pos2 += 1
                    break
                val += ch
                pos2 += 1
            result[key] = val
        else:
            while pos2 < len(body) and body[pos2] not in (",", "}"):
                pos2 += 1

    return result


def main() -> None:
    if not INPUT.exists():
        raise SystemExit(f"ERROR: {INPUT} not found")

    html = INPUT.read_text(encoding="utf-8")
    translations = extract_i18n(html)

    if not translations:
        raise SystemExit("ERROR: no translations extracted")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(translations, f, ensure_ascii=False, indent=2)

    print(f"Extracted {len(translations)} keys → {OUTPUT}")


if __name__ == "__main__":
    main()
