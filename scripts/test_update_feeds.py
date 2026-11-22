"""Regression tests for preserving a published collection during feed rotation."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import update_feeds as feeds


class CollectionRefreshTest(unittest.TestCase):
    def test_podcast_uses_show_artwork_and_plain_text(self):
        rss = b'''<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel>
          <itunes:image href="https://example.org/cover.jpg"/><item><title>Episode</title>
          <pubDate>Fri, 20 Nov 2026 08:00:00 GMT</pubDate><link>https://example.org/episode</link>
          <description><![CDATA[&lt;b&gt;Guest&lt;/b&gt;&lt;br&gt;Career plans]]></description>
          <enclosure type="audio/mpeg" url="https://example.org/show.mp3"/></item></channel></rss>'''
        row, = feeds.audio_entries(rss, {"feed": "https://example.org/feed"})
        self.assertEqual(row["summary"], "Guest Career plans")
        self.assertEqual(row["thumbnail"], "https://example.org/cover.jpg")

    def test_youtube_uploads_separate_formats_and_keep_unclassified_videos(self):
        channel = "UCbk_QsfaFZG6PdQeCvaYXJQ"

        def atom(video_id, date):
            return f'''<feed xmlns="{feeds.ATOM[1:-1]}" xmlns:yt="{feeds.YT[1:-1]}">
            <entry><yt:videoId>{video_id}</yt:videoId><yt:channelId>{channel}</yt:channelId>
            <title>Example</title><published>{date}</published></entry></feed>'''.encode()

        full, short, unclassified = "h4V7-RZjq5c", "sV9Dq8eE68k", "undecided0_"
        original = "2026-11-20T14:30:00Z"
        with patch.object(feeds, "download", side_effect=[
            atom(full, "2026-11-21T09:00:00Z"), atom(short, original), atom(full, original)
        ]):
            rows = {row["id"]: row for row in feeds.youtube_uploads({"id": channel})}
        self.assertEqual(rows[full]["format"], "full")
        self.assertEqual(rows[full]["published"], original)
        self.assertEqual(rows[short]["format"], "shorts")
        with patch.object(feeds, "download", side_effect=[OSError(), OSError(), atom(unclassified, original)]):
            fallback, = feeds.youtube_uploads({"id": channel})
        self.assertNotIn("format", fallback)

    def test_release_and_previous_deployment_survive_rotation(self):
        source = {"name": "Journal", "topic": "Career", "lang": "en"}
        def item(name):
            return {"id": name, "url": "https://example.org/" + name, "source": "Journal",
                    "title": name, "published": "2025-01-02T12:00:00Z"}

        def snapshot(items, checked):
            return {"schema": 2, "updated": checked, "sources": [{**source, "checked": checked}],
                    "items": items}

        local = snapshot([{**item("pinned"), "duration": 180}, item("archive")], "2025-01-03")
        deployed = snapshot([item("live"), item("pinned")], "2025-01-04")
        expected = {"pinned", "archive", "live", "fresh"}
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "data").mkdir()
            path = root / "data/videos.json"
            path.write_text(json.dumps(local), encoding="utf-8")
            with patch.object(feeds, "ROOT", root), patch.object(feeds, "download", return_value=json.dumps(deployed).encode()):
                with patch.object(feeds, "collect_source", return_value=[item("pinned"), item("fresh")]):
                    feeds.refresh("videos", [source], "https://example.org/")
                with patch.object(feeds, "collect_source", side_effect=OSError("offline")):
                    feeds.refresh("videos", [source], "https://example.org/")
            result = json.loads(path.read_text(encoding="utf-8"))
            rows = {row["id"]: row for row in result["items"]}
            self.assertEqual(set(rows), expected)
            self.assertEqual(rows["pinned"]["duration"], 180)
            self.assertEqual(result["sources"][0]["count"], len(expected))

if __name__ == "__main__":
    unittest.main()
