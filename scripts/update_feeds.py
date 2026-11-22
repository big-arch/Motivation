"""Build the static media library from publisher feeds and open catalogs."""

import argparse
import concurrent.futures
import email.utils
import hashlib
import html
import http.client
import json
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlencode, urljoin, urlsplit

from video_evidence import extract as video_evidence


ROOT = Path(__file__).resolve().parents[1]
ATOM = "{http://www.w3.org/2005/Atom}"
MEDIA = "{http://search.yahoo.com/mrss/}"
YT = "{http://www.youtube.com/xml/schemas/2015}"
DC = "{http://purl.org/dc/elements/1.1/}"
CONTENT = "{http://purl.org/rss/1.0/modules/content/}"
ITUNES = "{http://www.itunes.com/dtds/podcast-1.0.dtd}"
MOSCOW = timezone(timedelta(hours=3))
FEED_ERRORS = (OSError, ValueError, ET.ParseError, http.client.HTTPException)
MAX_DOWNLOAD = 20_000_000


def download(url: str, *, timeout=30, attempts=2) -> bytes:
    request = urllib.request.Request(url, headers={
        "User-Agent": "FounderJournal/3.0 (+https://github.com/big-arch/Motivation)",
        "Accept": "*/*",
    })
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                data = response.read(MAX_DOWNLOAD + 1)
            if len(data) > MAX_DOWNLOAD:
                raise ValueError("Feed exceeds size limit")
            return data
        except FEED_ERRORS:
            if attempt + 1 == attempts:
                raise
            time.sleep(0.4)
    raise ValueError("Download failed")


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


def clean_text(value: str, limit: int = 500) -> str:
    text = " ".join((value or "").split())
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(" ,:") + "…"


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
            request = urllib.request.Request(row["url"], headers={"User-Agent": "Mozilla/5.0 (compatible; FounderJournal/3.0)"})
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
            **video_evidence(node.findtext(MEDIA + "group/" + MEDIA + "description", "")),
        })
    return entries


def youtube_uploads(source: dict) -> list[dict]:
    base = "https://www.youtube.com/feeds/videos.xml?"
    channel = source["id"]
    typed = {}
    for prefix, kind in (("UULF", "full"), ("UUSH", "shorts")):
        try:
            data = download(base + "playlist_id=" + prefix + channel[2:], timeout=8, attempts=1)
            typed.update({row["id"]: {**row, "format": kind} for row in youtube_entries(data, source)})
        except FEED_ERRORS:
            continue
    try:
        mixed = youtube_entries(download(base + "channel_id=" + channel, timeout=12, attempts=1), source)
    except FEED_ERRORS:
        if not typed:
            raise
        return list(typed.values())
    for row in mixed:
        # Use the upload feed's publication date when both feeds include the video.
        typed[row["id"]] = {**typed.get(row["id"], {}), **row}
    return list(typed.values())


def keep_recent_formats(rows: list[dict], per_format: int) -> list[dict]:
    counts = {}
    selected = []
    for row in rows:
        kind = row.get("format", "")
        count = counts.get(kind, 0)
        if count < per_format:
            selected.append(row)
            counts[kind] = count + 1
    return selected


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
            **video_evidence(row.get("description", "")),
        })
    return entries


def seconds(value: str) -> int:
    text = (value or "").strip()
    if not text:
        return 0
    try:
        parts = [float(part) for part in text.split(":")]
    except ValueError:
        return 0
    if any(part < 0 for part in parts) or len(parts) > 3:
        return 0
    result = 0
    for part in parts:
        result = result * 60 + part
    return round(result)


def audio_summary(markup: str) -> str:
    # Some podcast publishers entity-encode the HTML inside RSS CDATA.
    return Excerpt(html.unescape(markup or "")).text(700)


def audio_entries(data: bytes, source: dict) -> list[dict]:
    entries = []
    channel = ET.fromstring(data).find("channel")
    if channel is None:
        return entries
    cover = channel.find(ITUNES + "image")
    artwork = (cover.get("href", "") if cover is not None else "") or channel.findtext("image/url", "")
    for node in channel.findall("item"):
        page_url = public_url(node.findtext("link") or "", source["feed"])
        title = clean_text(node.findtext("title") or "", 260)
        published = stamp(node.findtext("pubDate") or node.findtext(DC + "date") or "")
        audio = next((public_url(enclosure.get("url", ""), page_url) for enclosure in node.findall("enclosure")
                      if enclosure.get("type", "").startswith("audio/") and public_url(enclosure.get("url", ""), page_url)), "")
        url = page_url or audio
        if not (url and title and published and audio) or "�" in title:
            continue
        summary = audio_summary(node.findtext("description") or node.findtext(ITUNES + "summary") or
                                node.findtext(CONTENT + "encoded") or "")
        image = node.find(ITUNES + "image")
        media_image = node.find(MEDIA + "thumbnail")
        thumbnail = public_url((image.get("href", "") if image is not None else "") or
                               (media_image.get("url", "") if media_image is not None else "") or artwork, url)
        entries.append({
            "id": "audio-" + hashlib.sha1(url.encode("utf-8")).hexdigest()[:16],
            "title": title, "url": url, "audio": audio, "published": published,
            "summary": summary, "thumbnail": thumbnail,
            "duration": seconds(node.findtext(ITUNES + "duration") or ""),
        })
    return entries


def librivox_entries(data: bytes, source: dict, now: str) -> list[dict]:
    entries = []
    for book in json.loads(data).get("books", []):
        page = public_url(book.get("url_librivox", ""))
        chapters = []
        for section in book.get("sections", []):
            audio = public_url(section.get("listen_url") or "")
            if not audio:
                continue
            chapters.append({
                "id": "lv-" + str(section.get("id", "")),
                "title": clean_text(section.get("title") or "Глава " + str(section.get("section_number", "")),
                                    180),
                "audio": audio, "duration": seconds(str(section.get("playtime") or "")),
            })
        title = clean_text(book.get("title") or "", 260)
        if not (page and title and chapters) or "�" in title:
            continue
        authors = ", ".join(clean_text(author.get("first_name", "") + " " + author.get("last_name", ""), 100)
                            for author in book.get("authors", [])) or "Автор не указан"
        entries.append({
            "id": "lv-book-" + str(book.get("id", "")), "title": title, "url": page,
            "audio": chapters[0]["audio"], "chapters": chapters[:100], "published": now,
            "summary": Excerpt(book.get("description", "")).text(700), "thumbnail": public_url(book.get("coverart_thumbnail") or ""),
            "duration": int(book.get("totaltimesecs") or 0), "author": authors,
            "language_name": book.get("language") or "English", "rights": "Public domain · LibriVox",
        })
    return entries


def openlibrary_entries(data: bytes, source: dict, now: str) -> list[dict]:
    entries = []
    for book in json.loads(data).get("docs", []):
        title = clean_text(book.get("title") or "", 240)
        authors = ", ".join(book.get("author_name", [])) or "Автор не указан"
        archive = next((value for value in book.get("ia", []) if re.fullmatch(r"[\w.-]+", value, re.ASCII)), "")
        work = book.get("key", "")
        languages = book.get("language", [])
        if languages and not {"eng", "rus"}.intersection(languages):
            continue
        if not (book.get("public_scan_b") and book.get("ebook_access") == "public" and archive and
                re.fullmatch(r"/works/OL\d+W", work) and title and "�" not in title + authors):
            continue
        year = int(book.get("first_publish_year") or 0)
        if year > datetime.now(timezone.utc).year:
            continue
        page = public_url("https://openlibrary.org" + work)
        entries.append({
            "id": "ol-" + work.rsplit("/", 1)[-1], "title": title, "url": page,
            "lang": "ru" if "rus" in languages else "en",
            "read_url": "https://archive.org/details/" + archive,
            "embed": "https://archive.org/embed/" + archive,
            "published": now, "author": clean_text(authors, 180), "year": year,
            "thumbnail": public_url("https://covers.openlibrary.org/b/id/" + str(book.get("cover_i", "")) + "-L.jpg")
            if book.get("cover_i") else "",
            "summary": "Открытое издание в Internet Archive. Доступность и условия чтения указаны на странице оригинала.",
            "rights": "Open Library · Internet Archive",
        })
    return entries


def collect(source: dict, now: str) -> list[dict]:
    platform = source.get("platform")
    if platform == "youtube":
        rows = youtube_uploads(source)
    elif platform == "rutube":
        url = "https://rutube.ru/api/video/person/" + source["id"] + "/?format=json"
        rows = rutube_entries(download(url), source)
    elif platform == "rss-audio":
        rows = audio_entries(download(source["feed"]), source)
    elif platform == "librivox":
        query = urlencode({"genre": source["genre"], "format": "json", "extended": 1,
                           "coverart": 1, "limit": 50, "sort_order": "desc"})
        rows = librivox_entries(download("https://librivox.org/api/feed/audiobooks/?" + query), source, now)
    elif platform == "openlibrary":
        query = urlencode({
            "q": "subject:" + source["query"] + " ebook_access:public",
            "fields": "key,title,author_name,first_publish_year,cover_i,ia,public_scan_b,language,ebook_access",
            "sort": "new", "limit": 50,
        })
        rows = openlibrary_entries(download("https://openlibrary.org/search.json?" + query), source, now)
    else:
        rows = news_entries(download(source["feed"]), source)
    valid = []
    for row in rows:
        if row["title"] and row["published"] and row["published"] <= now:
            extra = {key: source[key] for key in ("kind", "action") if key in source}
            valid.append({**row, "source": source["name"], "topic": source["topic"],
                          "lang": row.get("lang", source["lang"]), **extra})
    if not valid:
        raise ValueError("No published entries with an original date")
    ordered = sorted(valid, key=lambda item: item["published"], reverse=True)
    unique = list({item["url"]: item for item in ordered}.values())
    return keep_recent_formats(unique, 6) if platform == "youtube" else unique[:6]


def collect_source(source, now, previous):
    rows = collect(source, now)
    if source.get("platform") in {"librivox", "openlibrary"}:
        known = {row["url"]: row["published"] for row in previous.get("items", [])}
        for row in rows:
            row["published"] = known.get(row["url"], row["published"])
    elif "feed" in source and not source.get("platform"):
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
    # Keep the checked-in collection and a rolling window from Pages.
    for index, snapshot in enumerate(snapshots):
        if snapshot.get("schema") != 2:
            continue
        by_source = {}
        for item in snapshot.get("items", []):
            by_source.setdefault(item["source"], []).append(item)
        for entry in snapshot.get("sources", []):
            name = entry["name"]
            rows = by_source.get(name, [])
            if not rows:
                continue
            prior = result.setdefault(name, {"checked": "", "items": []})
            merged = {row["url"]: row for row in prior["items"]}
            checked = entry.get("checked") or ""
            if index:
                rows = keep_recent_formats(rows, 24) if entry.get("platform") == "youtube" else rows[:24]
            for row in rows:
                existing = merged.get(row["url"], {})
                if path.stem in {"audio", "open-books"} and existing and (row.get("chapters") or row.get("embed")):
                    row = {**row, "published": existing["published"]}
                merged[row["url"]] = {**existing, **row} if checked >= prior["checked"] else {**row, **existing}
            prior["items"] = list(merged.values())
            prior["checked"] = max(prior["checked"], checked)
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
                merged = {row["url"]: row for row in previous.get(name, {}).get("items", [])}
                for row in future.result():
                    # Preserve fields such as the verified running time of a YouTube episode.
                    merged[row["url"]] = {**merged.get(row["url"], {}), **row}
                rows = list(merged.values())
                checked = now
                successes += 1
            except FEED_ERRORS as error:
                print(f"{name}: retaining last snapshot ({error})", file=sys.stderr)
                backup = previous.get(name, {})
                rows, checked = backup.get("items", []), backup.get("checked", "")
            if kind == "audio":
                for row in rows:
                    row["summary"] = audio_summary(row.get("summary", ""))
            items.extend(rows)
            directory.append({**{k: v for k, v in source.items() if k not in {"feed", "query", "genre"}},
                              "count": len(rows), "checked": checked})
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
    parser.add_argument("--only", nargs="+", choices=("news", "videos", "audio", "open-books"))
    options = parser.parse_args()
    config = json.loads((ROOT / "data/sources.json").read_text(encoding="utf-8-sig"))
    for category in options.only or ("news", "videos", "audio", "open-books"):
        refresh(category, config[category], options.previous_url)
