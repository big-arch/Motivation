import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import refresh_sections as sections
import update_feeds as feeds


class TestAutonomousEdition(unittest.TestCase):
    def test_classification_and_repeat_or_publisher_outage(self):
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder)
            def article(source,title,n):
                return dict(source=source,title=title,url=f'https://example.org/p/{n}?utm_medium=feed',
                            published="2024-01-01T00:00:00Z",lang="en")
            news=[article("Inc.","Vendor files for bankruptcy",1),article("Zen Habits","Sustaining a habit",2),
                  article("Entrepreneur","How to start a company",3),article("Press","Unrelated event",4)]
            for kind,rows in {"news":news,"audio":[article("Основатели","Как команда построила бизнес",5)],
                              "videos":[article("Video","Film",6)],"open-books":[article("Books","Book",7)]}.items():
                sections.write(base/(kind+".json"),dict(items=rows,updated="2024-01-02",sources=[]))
            sections.write(base/"video-analysis.json",{"youtube:test":{}})
            rss=b'<rss><channel><item><title>Incident report</title><link>https://example.org/report</link><pubDate>Sat, 06 Jan 2024 00:00:00 GMT</pubDate></item></channel></rss>'
            spec=[("Inside GOV.UK","museum","https://example.org/rss")]
            with patch.object(sections,"FEEDS",spec), patch.object(sections,"download",return_value=rss):
                sections.refresh(base)
                first=(base/"sections.json").read_bytes()
                sections.refresh(base)
                self.assertEqual(first,(base/"sections.json").read_bytes())
            with patch.object(sections,"FEEDS",spec), patch.object(sections,"download",side_effect=OSError("offline")):
                sections.refresh(base)
            self.assertEqual(first,(base/"sections.json").read_bytes())
            actual=json.loads(first)["sections"]
            self.assertEqual(len(actual["museum"]),2)
            self.assertTrue(all("utm_" not in x["url"] for rows in actual.values() for x in rows))
            self.assertFalse(json.loads((base/"site-status.json").read_text())["editorialSources"][0]["ok"])

    def test_catalog_discovers_older_pages_without_redating_books(self):
        src={"name":"Books","platform":"openlibrary"}
        first={"url":"https://example.org/one","published":"2020-05-01"}
        today="2026-11-26T01:00:00Z"
        archive={"url":"https://example.org/two","published":today}
        with patch.object(feeds,"collect",side_effect=[[{**first,"published":today}],[archive]]) as fn:
            rows=feeds.collect_source(src,today,{"items":[first]})
        self.assertGreater(fn.call_args_list[1].args[2],1)
        self.assertEqual(rows,[first,archive])
