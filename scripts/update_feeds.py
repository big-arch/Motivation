"""Refresh the journal's RSS / Atom snapshots using only the standard library."""

import argparse
import concurrent.futures
import email.utils
import html
import http.client
import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "news": {
        "Коммерсантъ": "https://www.kommersant.ru/RSS/section-business.xml",
        "Russian Business": "https://rb.ru/feeds/news/",
        "vc.ru": "https://vc.ru/rss",
        "TechCrunch": "https://techcrunch.com/feed/",
    },
    "videos": {
        "Y Combinator": "https://www.youtube.com/feeds/videos.xml?channel_id=UCcefcZRL2oaA_uBNeo5UOWg",
        "The Diary Of A CEO": "https://www.youtube.com/feeds/videos.xml?channel_id=UCGq-a57w-aPwyi3pW7XLiHw",
        "Computer History Museum": "https://www.youtube.com/feeds/videos.xml?channel_id=UCHDr4RtxwA1KqKGwxgdK4Vg",
    },
}
ATOM = "{http://www.w3.org/2005/Atom}"


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "FounderJournal/1.0 (+https://github.com/big-arch/Motivation)", "Accept": "*/*"})
    with urllib.request.urlopen(request, timeout=18) as response:
        data = response.read(5_000_001)
    if len(data) > 5_000_000:
        raise ValueError("Snapshot exceeds size limit")
    return data


def stamp(value: str) -> str:
    if not value:
        return ""
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        try:
            parsed = email.utils.parsedate_to_datetime(value)
        except (TypeError, ValueError, OverflowError):
            return ""
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def parse(xml: bytes, source: str) -> list[dict]:
    root = ET.fromstring(xml)
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    output = []
    for node in root.findall("./channel/item") + root.findall(ATOM + "entry"):
        title = node.findtext("title") or node.findtext(ATOM + "title") or ""
        title = " ".join(re.sub(r"<[^>]+>", "", html.unescape(title)).split())
        url = (node.findtext("link") or "").strip()
        if not url:
            url = next((link.get("href", "") for link in node.findall(ATOM + "link")
                        if link.get("rel", "alternate") == "alternate"), "")
        if not title or urlsplit(url).scheme not in {"https", "http"}:
            continue
        published = stamp(node.findtext("pubDate") or node.findtext(ATOM + "published") or "")
        if published and published > now:
            continue
        output.append({"title": title, "url": url, "source": source, "published": published})
    if not output:
        raise ValueError("No usable articles")
    return sorted(output, key=lambda row: row["published"], reverse=True)[:8]


def previous(path: Path, base_url: str) -> dict:
    snapshots = []
    if path.exists():
        snapshots.append(json.loads(path.read_text(encoding="utf-8")))
    if base_url:
        try:
            public = json.loads(download(f"{base_url.rstrip('/')}/data/{path.name}"))
            if isinstance(public.get("items"), list):
                snapshots.append(public)
        except (OSError, ValueError, AttributeError, http.client.HTTPException) as error:
            print(f"{path.name}: previous deployment unavailable ({type(error).__name__})", file=sys.stderr)
    return max(snapshots, key=lambda value: value.get("updated") or "", default={"updated": None, "items": []})


def refresh(kind: str, base_url: str) -> None:
    path = ROOT / "data" / f"{kind}.json"
    cache = previous(path, base_url)
    sources = SOURCES[kind]
    latest = []
    successes = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        pending = {pool.submit(download, url): name for name, url in sources.items()}
        for future in concurrent.futures.as_completed(pending):
            source = pending[future]
            try:
                latest.extend(parse(future.result(), source))
                successes += 1
            except (OSError, ValueError, ET.ParseError, http.client.HTTPException) as error:
                print(f"{source}: keeping previous items ({error})", file=sys.stderr)
                latest.extend(item for item in cache["items"] if item.get("source") == source)
    if not latest:
        raise RuntimeError(f"No current or archived entries for {kind}")
    distinct = {row["url"]: row for row in latest}
    snapshot = {
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z") if successes else cache.get("updated"),
        "items": sorted(distinct.values(), key=lambda row: (row["published"], row["url"]), reverse=True),
    }
    path.parent.mkdir(exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)
    print(f"{kind}: {len(snapshot['items'])} entries, {successes}/{len(sources)} sources refreshed")


if __name__ == "__main__":
    args = argparse.ArgumentParser()
    args.add_argument("--previous-url", default="", help="Existing Pages site whose last snapshot may be reused")
    options = args.parse_args()
    failures = []
    for category in SOURCES:
        try:
            refresh(category, options.previous_url)
        except RuntimeError as error:
            failures.append(str(error))
    if failures:
        sys.exit("\n".join(failures))
