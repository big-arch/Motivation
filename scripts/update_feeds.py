"""Build the static media library from publisher feeds and public video channels."""

import argparse
import concurrent.futures
import email.utils
import html
import http.client
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit


ROOT = Path(__file__).resolve().parents[1]
ATOM = "{http://www.w3.org/2005/Atom}"
MEDIA = "{http://search.yahoo.com/mrss/}"
YT = "{http://www.youtube.com/xml/schemas/2015}"
DC = "{http://purl.org/dc/elements/1.1/}"
CONTENT = "{http://purl.org/rss/1.0/modules/content/}"
MOSCOW = timezone(timedelta(hours=3))
FEED_ERRORS = (OSError, ValueError, ET.ParseError, http.client.HTTPException)


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={
        "User-Agent": "FounderJournal/2.0 (+https://github.com/big-arch/Motivation)",
        "Accept": "*/*",
    })
    with urllib.request.urlopen(request, timeout=20) as response:
        data = response.read(8_000_001)
    if len(data) > 8_000_000:
        raise ValueError("Feed exceeds size limit")
    return data


def stamp(value: str, default_zone=timezone.utc) -> str:
    if not value:
        return ""
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        try:
            parsed = email.utils.parsedate_to_datetime(value)
        except (TypeError, ValueError, OverflowError):
            return ""
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=default_zone)
    return parsed.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def public_url(value: str, base: str = "") -> str:
    resolved = urljoin(base, html.unescape((value or "").strip())) if value else ""
    parts = urlsplit(resolved)
    if parts.scheme not in {"http", "https"} or not parts.hostname or parts.username or parts.password:
        return ""
    return resolved


class PagePreview(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.image = ""

    def handle_starttag(self, tag, attrs):
        if tag == "meta" and not self.image:
            fields = dict(attrs)
            if (fields.get("property") or fields.get("name")) in {"og:image", "twitter:image", "twitter:image:src"}:
                self.image = fields.get("content", "")


def fill_previews(rows: list[dict], previous: list[dict], feed_url: str) -> None:
    known = {row["url"]: row.get("thumbnail", "") for row in previous}
    publisher = re.sub(r"^(www|rss|feeds?)\.", "", urlsplit(feed_url).hostname or "")
    for row in rows:
        row["thumbnail"] = row.get("thumbnail") or known.get(row["url"], "")
        if row["thumbnail"]:
            continue
        host = urlsplit(row["url"]).hostname or ""
        if not host or not (host == publisher or host.endswith("." + publisher)):
            continue
        try:
            request = urllib.request.Request(row["url"], headers={"User-Agent": "Mozilla/5.0 (compatible; FounderJournal/2.0)"})
            with urllib.request.urlopen(request, timeout=5) as page:
                parser = PagePreview()
                parser.feed(page.read(130_000).decode("utf-8", "replace"))
                row["thumbnail"] = public_url(parser.image, page.geturl())
        except FEED_ERRORS:
            continue


class Excerpt(HTMLParser):
    """Read plain text and the first editorial image from an RSS description."""

    def __init__(self, markup: str):
        super().__init__(convert_charrefs=True)
        self.words = []
        self.image = ""
        self.feed(markup or "")

    def handle_data(self, data):
        self.words.append(data)

    def handle_starttag(self, tag, attrs):
        if tag == "img" and not self.image:
            attributes = dict(attrs)
            if attributes.get("width") not in {"1", "2"}:
                self.image = attributes.get("src") or attributes.get("data-src") or ""

    def text(self, limit):
        value = " ".join(" ".join(self.words).split())
        if len(value) <= limit:
            return value
        return value[:limit].rsplit(" ", 1)[0].rstrip(" ,:") + "…"


def news_entries(data: bytes, source: dict) -> list[dict]:
    root = ET.fromstring(data)
    entries = []
    for node in root.findall("./channel/item") + root.findall(ATOM + "entry"):
        raw_url = node.findtext("link") or next((n.get("href") for n in node.findall(ATOM + "link")
                                                 if n.get("rel", "alternate") == "alternate"), "")
        url = public_url(raw_url or "", source["feed"])
        title = Excerpt(node.findtext("title") or node.findtext(ATOM + "title") or "").text(260)
        date = stamp(node.findtext("pubDate") or node.findtext(ATOM + "published") or
                     node.findtext(DC + "date") or "")
        if not (url and title and date):
            continue
        excerpt = Excerpt(node.findtext("description") or node.findtext(ATOM + "summary") or
                          node.findtext(CONTENT + "encoded") or node.findtext(ATOM + "content") or "")
        thumbnail = ""
        for media in [*node.iter(MEDIA + "thumbnail"), *node.iter(MEDIA + "content"), *node.findall("enclosure")]:
            if media.tag.endswith("thumbnail") or media.get("medium") == "image" or media.get("type", "").startswith("image/") or re.search(r"\.(jpe?g|png|webp)(?:[?#]|$)", media.get("url", ""), re.I):
                thumbnail = public_url(media.get("url", ""), url)
                if thumbnail:
                    break
        if not (thumbnail or excerpt.image):
            content = Excerpt(node.findtext(CONTENT + "encoded") or node.findtext(ATOM + "content") or "")
            thumbnail = public_url(content.image, url)
        entries.append({"title": title, "url": url, "published": date, "summary": excerpt.text(195),
                        "thumbnail": thumbnail or public_url(excerpt.image, url)})
    return entries


def youtube_entries(data: bytes, source: dict) -> list[dict]:
    entries = []
    for node in ET.fromstring(data).findall(ATOM + "entry"):
        video = node.findtext(YT + "videoId", "")
        if not re.fullmatch(r"[\w-]{11}", video, re.ASCII) or node.findtext(YT + "channelId") != source["id"]:
            continue
        entries.append({
            "id": video, "platform": "youtube", "title": node.findtext(ATOM + "title", "").strip(),
            "url": "https://www.youtube.com/watch?v=" + video,
            "published": stamp(node.findtext(ATOM + "published", "")),
            "thumbnail": "https://i.ytimg.com/vi/" + video + "/hqdefault.jpg",
            "summary": Excerpt(node.findtext(MEDIA + "group/" + MEDIA + "description", "")).text(200),
        })
    return entries


def rutube_entries(data: bytes, source: dict) -> list[dict]:
    entries = []
    for row in json.loads(data).get("results", []):
        video = row.get("id", "")
        if str(row.get("author", {}).get("id")) != source["id"] or not re.fullmatch(r"[a-f0-9]{32}", video):
            continue
        if any(row.get(flag) for flag in ("is_hidden", "is_deleted", "is_paid", "is_club", "is_adult", "is_on_air", "is_audio")):
            continue
        if not row.get("embed_url") or not row.get("thumbnail_url"):
            continue
        entries.append({
            "id": video, "platform": "rutube", "title": row.get("title", "").strip(),
            "url": "https://rutube.ru/video/" + video + "/",
            "published": stamp(row.get("publication_ts", ""), MOSCOW),
            "thumbnail": public_url(row["thumbnail_url"]), "duration": int(row.get("duration") or 0),
            "summary": Excerpt(row.get("description", "")).text(200),
        })
    return entries


def collect(source: dict, now: str) -> list[dict]:
    platform = source.get("platform")
    if platform == "youtube":
        url = "https://www.youtube.com/feeds/videos.xml?channel_id=" + source["id"]
        rows = youtube_entries(download(url), source)
    elif platform == "rutube":
        url = "https://rutube.ru/api/video/person/" + source["id"] + "/?format=json"
        rows = rutube_entries(download(url), source)
    else:
        rows = news_entries(download(source["feed"]), source)
    valid = []
    for row in rows:
        if row["title"] and row["published"] and row["published"] <= now:
            valid.append({**row, "source": source["name"], "topic": source["topic"], "lang": source["lang"]})
    if not valid:
        raise ValueError("No published entries with an original date")
    ordered = sorted(valid, key=lambda item: item["published"], reverse=True)
    return list({item["url"]: item for item in ordered}.values())[:6]


def collect_source(source, now, previous):
    rows = collect(source, now)
    if "feed" in source:
        fill_previews(rows, previous.get("items", []), source["feed"])
    return rows


def prior_sources(path: Path, base_url: str) -> dict:
    snapshots = []
    if path.exists():
        snapshots.append(json.loads(path.read_text(encoding="utf-8-sig")))
    if base_url:
        try:
            snapshots.append(json.loads(download(f"{base_url.rstrip('/')}/data/{path.name}")))
        except FEED_ERRORS as error:
            print(f"{path.name}: previous deployment unavailable ({type(error).__name__})", file=sys.stderr)
    result = {}
    for snapshot in sorted(snapshots, key=lambda s: s.get("updated") or ""):
        if snapshot.get("schema") != 2:
            continue
        by_source = {}
        for item in snapshot.get("items", []):
            by_source.setdefault(item["source"], []).append(item)
        for entry in snapshot.get("sources", []):
            name = entry["name"]
            if by_source.get(name) and (entry.get("checked") or "") >= result.get(name, {}).get("checked", ""):
                result[name] = {"checked": entry.get("checked") or "", "items": by_source[name]}
    return result


def refresh(kind: str, sources: list[dict], base_url: str) -> None:
    path = ROOT / "data" / (kind + ".json")
    previous = prior_sources(path, base_url)
    now = stamp(datetime.now(timezone.utc).isoformat())
    items, directory = [], []
    successes = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        pending = {pool.submit(collect_source, source, now, previous.get(source["name"], {})): source for source in sources}
        for future in concurrent.futures.as_completed(pending):
            source = pending[future]
            name = source["name"]
            try:
                rows = future.result()
                checked = now
                successes += 1
            except FEED_ERRORS as error:
                print(f"{name}: retaining last snapshot ({error})", file=sys.stderr)
                backup = previous.get(name, {})
                rows, checked = backup.get("items", []), backup.get("checked", "")
            items.extend(rows)
            directory.append({**{k: v for k, v in source.items() if k != "feed"}, "count": len(rows), "checked": checked})
    if not items:
        raise RuntimeError(f"No usable {kind} to publish")
    items = sorted(items, key=lambda row: (row["published"], row["url"]), reverse=True)
    snapshot = {"schema": 2, "updated": max(row["checked"] for row in directory),
                "sources": sorted(directory, key=lambda row: (row["lang"] != "ru", row["name"].casefold())),
                "items": list({row["url"]: row for row in items}.values())}
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)
    print(f"{kind}: {len(snapshot['items'])} entries, {successes}/{len(sources)} sources refreshed")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--previous-url", default="")
    options = parser.parse_args()
    config = json.loads((ROOT / "data/sources.json").read_text(encoding="utf-8-sig"))
    for category in ("news", "videos"):
        refresh(category, config[category], options.previous_url)
