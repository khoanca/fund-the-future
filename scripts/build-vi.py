#!/usr/bin/env python3
"""Build static Vietnamese /vi/ directory from index.html and i18n-vi.json."""

import argparse
import json
import re
import shutil
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INPUT_HTML = ROOT / "index.html"
I18N_JSON = Path(__file__).resolve().parent / "i18n-vi.json"
VI_DIR = ROOT / "vi"


def step_add_hreflang(html: str) -> str:
    tags = [
        '<link rel="alternate" hreflang="en" href="https://theedgealliance.com/" />',
        '<link rel="alternate" hreflang="vi" href="https://theedgealliance.com/vi/" />',
        '<link rel="alternate" hreflang="x-default" href="https://theedgealliance.com/" />',
        '<link rel="canonical" href="https://theedgealliance.com/vi/" />',
    ]
    insertion = "\n" + "\n".join(tags)
    match = re.search(r'<link rel="canonical"[^>]*>', html)
    if match:
        end = match.end()
        return html[:end] + insertion + html[end:]
    match = re.search(r'<meta name="theme-color"[^>]*>', html)
    if match:
        end = match.end()
        return html[:end] + insertion + html[end:]
    return html


UNPAIRED_TAGS = frozenset(
    {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }
)


class I18NReplacer(HTMLParser):
    def __init__(self, translations: dict[str, str]):
        super().__init__(convert_charrefs=False)
        self.translations = translations
        self.parts: list[str] = []
        self.skip_content = 0  # nesting depth of tags with data-i18n
        self.i18n_stack: list[tuple[str, str, str]] = []  # (tag, key, attrs_string_to_restore_or_empty)
        self.i18n_keys_found: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        key = attrs_dict.get("data-i18n")
        ph_key = attrs_dict.get("data-i18n-ph")

        # Handle data-i18n
        if key and key in self.translations:
            self.i18n_keys_found.add(key)
            if ph_key and ph_key in self.translations:
                self.i18n_keys_found.add(ph_key)
            new_attrs = [(k, v) for k, v in attrs if k not in ("data-i18n", "data-i18n-ph")]
            if ph_key and ph_key in self.translations:
                new_attrs = [(k, v) for k, v in new_attrs if k != "placeholder"]
                new_attrs.append(("placeholder", self.translations[ph_key]))
            if tag.lower() in UNPAIRED_TAGS:
                self._emit_tag(tag, new_attrs, self_closing=True)
            else:
                self._emit_tag(tag, new_attrs, self_closing=False)
                self.parts.append(self.translations[key])
                self.skip_content += 1
                self.i18n_stack.append((tag, key, ""))
        elif ph_key and ph_key in self.translations:
            self.i18n_keys_found.add(ph_key)
            new_attrs = [(k, v) for k, v in attrs if k != "data-i18n-ph"]
            found_ph = False
            for i, (ak, av) in enumerate(new_attrs):
                if ak == "placeholder":
                    new_attrs[i] = ("placeholder", self.translations[ph_key])
                    found_ph = True
                    break
            if not found_ph:
                new_attrs.append(("placeholder", self.translations[ph_key]))
            self._emit_tag(tag, new_attrs, self_closing=tag.lower() in UNPAIRED_TAGS)
        else:
            self._emit_tag(tag, attrs, self_closing=tag.lower() in UNPAIRED_TAGS)

    def handle_endtag(self, tag: str) -> None:
        if self.skip_content > 0 and self.i18n_stack and self.i18n_stack[-1][0] == tag:
            self.i18n_stack.pop()
            self.skip_content -= 1
            return
        self.parts.append(f"</{tag}>")

    def handle_data(self, data: str) -> None:
        if self.skip_content > 0:
            return
        self.parts.append(data)

    def handle_entityref(self, name: str) -> None:
        if self.skip_content > 0:
            return
        self.parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        if self.skip_content > 0:
            return
        self.parts.append(f"&#{name};")

    def handle_comment(self, data: str) -> None:
        self.parts.append(f"<!--{data}-->")

    def handle_decl(self, decl: str) -> None:
        self.parts.append(f"<!{decl}>")

    def unknown_decl(self, data: str) -> None:
        self.parts.append(f"<![{data}]>")

    def _emit_tag(self, tag: str, attrs: list[tuple[str, str | None]], self_closing: bool) -> None:
        parts = [f"<{tag}"]
        for k, v in attrs:
            if v is None:
                parts.append(f" {k}")
            else:
                parts.append(f' {k}="{v}"')
        if self_closing:
            parts.append(" />")
        else:
            parts.append(">")
        self.parts.append("".join(parts))

    def get_html(self) -> str:
        return "".join(self.parts)

    def error(self, message: str) -> None:
        pass


def step_replace_i18n(html: str, translations: dict[str, str]) -> str:
    replacer = I18NReplacer(translations)
    replacer.feed(html)
    result = replacer.get_html()
    unused = set(translations) - replacer.i18n_keys_found
    if unused:
        print(f"  Note: {len(unused)} i18n keys not found in HTML: {sorted(unused)[:10]}...", file=sys.stderr)
    return result


def step_update_toggle(html: str) -> str:
    html = html.replace(
        '<a href="/vi/" hreflang="vi" lang="vi" onclick="setLang(\'vi\'); return false;" class="btn btn-ghost lang-btn" id="langVi" aria-label="Tiếng Việt">VI</a>',
        '<a href="/vi/" class="btn btn-ghost lang-btn active" id="langVi" aria-label="Tiếng Việt">VI</a>',
    )
    html = html.replace(
        '<a href="/" hreflang="en" lang="en" onclick="setLang(\'en\'); return false;" class="btn btn-ghost lang-btn" id="langEn" style="display:none" aria-label="English">EN</a>',
        '<a href="/" class="btn btn-ghost lang-btn" id="langEn" aria-label="English">EN</a>',
    )
    return html


def step_fix_language_toggle_js(html: str) -> str:
    html = re.sub(r"window\.FTF_LANG\s*=\s*'en'", "window.FTF_LANG = 'vi'", html)
    return html


def build_vi(translations: dict[str, str], dry_run: bool = False) -> None:
    if not INPUT_HTML.exists():
        raise SystemExit(f"ERROR: {INPUT_HTML} not found")

    html = INPUT_HTML.read_text(encoding="utf-8")

    html = html.replace('<html lang="en">', '<html lang="vi">')
    html = step_add_hreflang(html)
    html = step_replace_i18n(html, translations)
    html = step_update_toggle(html)
    html = step_fix_language_toggle_js(html)

    if dry_run:
        print(f"[DRY RUN] Would write {VI_DIR}/index.html ({len(html)} bytes)")
        for src_name in ["bgk.html", "community.html"]:
            src = ROOT / src_name
            if src.exists():
                print(f"[DRY RUN] Would copy {src_name} → {VI_DIR}/{src_name}")
            else:
                print(f"[DRY RUN] {src_name} not found, skipping", file=sys.stderr)
    else:
        VI_DIR.mkdir(parents=True, exist_ok=True)
        out_path = VI_DIR / "index.html"
        out_path.write_text(html, encoding="utf-8")
        print(f"Wrote {out_path} ({len(html)} bytes)")

        for src_name in ["bgk.html", "community.html"]:
            src = ROOT / src_name
            dst = VI_DIR / src_name
            if src.exists():
                shutil.copy2(src, dst)
                print(f"Copied {src_name} → {dst}")
            else:
                print(f"Skipped {src_name} (not found)", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build static VI pages")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    if not I18N_JSON.exists():
        raise SystemExit(
            f"ERROR: {I18N_JSON} not found. Run extract-i18n.py first."
        )

    translations = json.loads(I18N_JSON.read_text(encoding="utf-8"))
    build_vi(translations, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
