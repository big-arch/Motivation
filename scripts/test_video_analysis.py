import unittest
from unittest.mock import patch
import json
import tempfile
from pathlib import Path

from video_evidence import extract
import build_video_analysis as build
from index_video_notes import fragments


class VideoAnalysisTest(unittest.TestCase):
    def test_promotion_and_chapters_are_not_spoken_content(self):
        guide = extract("Реклама: https://offer.example\n00:00 Начало\n20:53 Как появился Smartcat\n"
                        "01:23:09 Проверка перевода\nКнига гостя — https://books.example.org/title\n"
                        "Скидка на книгу https://sale.example")["guide"]
        self.assertNotIn("notes", guide)
        self.assertEqual(guide["chapters"][-1], [4989, "Проверка перевода"])
        self.assertEqual(guide["links"], [["Книга гостя", "https://books.example.org/title"]])

    def test_index_uses_complete_source_sentences_and_keeps_chapter_times(self):
        item = {"title": "Архив", "summary": "Команда научилась обнаруживать ошибки перевода ещё до того, как материал попадал к заказчику. Фраза обрыва…"}
        self.assertEqual(len(fragments(item)), 1)
        self.assertNotIn("обрыва", fragments(item)[0]["text"])
        self.assertFalse(fragments({"title": "Без описания", "summary": "Без описания"}))
        rows = fragments({**item, "guide": {"chapters": [[20, "Как устроена проверка переводов"]]}})
        self.assertEqual(rows[-1]["start"], 20)

    def test_reference_time_is_taken_from_evidence(self):
        raw = {"summary": "Разбирается пример работы команды.", "practice": "Как вы это проверите?",
               "points": [{"source": 0, "text": "Команда сверяла результат.", "start": 999}]}
        self.assertEqual(build.validate(raw, [{"start": 34}])["points"][0]["start"], 34)
        raw["points"][0]["source"] = -1
        with self.assertRaises(ValueError):
            build.validate(raw, [{"start": 34}])

    def test_previous_public_entries_survive_and_editorial_entries_win(self):
        with tempfile.TemporaryDirectory() as temp:
            dest = Path(temp) / "video-analysis.json"
            dest.write_text('{"youtube:a":{"basis":"asr"},"youtube:c":{"basis":"outline","fingerprint":"1"}}')
            previous = {"youtube:a": {"basis": "notes"}, "vimeo:b": {"basis": "publisher"}, "youtube:c": {"basis":"asr","fingerprint":"2"}}
            with patch.object(build, "FILE", dest), patch.object(build, "download", return_value=json.dumps(previous).encode()):
                build.refresh("https://example.org/", 0)
            saved = json.loads(dest.read_text())
            self.assertEqual(saved["youtube:a"]["basis"], "asr")
            self.assertIn("vimeo:b", saved)
            self.assertEqual(saved['youtube:c']['basis'], 'asr')
