"""Small, attributable pieces of a publisher's video notes. Never treat them as speech."""
import html
import re
from html.parser import HTMLParser
from urllib.parse import urlsplit

TIME = re.compile(r"^[^\w]{0,5}(?P<time>(?:\d{1,2}:)?\d{1,3}:[0-5]\d)\s*[-–—|:.)]?\s*(?P<label>\S.*)")
URL = re.compile(r"https?://[^\s<>\"']+", re.I)
PROMO = re.compile(r"промокод|скидк|реклам|рассрочк|подписыва|подпиш|по вопросам сотруднич|розыгрыш|наш[иу] соцсет|telegram.канал|купите|покупайте|запишитесь|спецпредлож|закажи|оформите|получите|бесплатн\w* (?:урок|курс|вебинар|консультац)|erid|sponsor|this episode is brought|promo code|discount|subscribe|affiliate|sign up|free trial|shop (?:now|my)|use code|follow (?:us|me)|join (?:our|my)|support (?:the|our) (?:show|channel)", re.I)
LINK_LABEL = re.compile(r"книг|исследован|стать[яиюе]|материал|слайд|репозитор|документац|ссылк. (?:на|из)|сайт (?:гостя|проекта)|linkedin|research|study|paper|book|slides|resources?|mentioned|documentation|article", re.I)


class Lines(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in {"br", "p", "div", "li"}:
            self.parts.append("\n")
        elif tag == "a":
            address = dict(attrs).get("href", "")
            if address.startswith(("https://", "http://")):
                self.parts.append(" " + address + " ")

    def handle_endtag(self, tag):
        if tag in {"p", "div", "li"}:
            self.parts.append("\n")

    def handle_data(self, data):
        self.parts.append(data)


def extract(value):
    parser = Lines()
    parser.feed(html.unescape(value or ""))
    lines = [" ".join(line.split()) for line in "".join(parser.parts).splitlines()]
    chapters, paragraphs, links = [], [], []
    seen = set()
    for line in lines:
        if not line or PROMO.search(line):
            continue
        chapter = TIME.match(line)
        if chapter and not URL.search(line):
            total = 0
            for part in chapter["time"].split(":"):
                total = total * 60 + int(part)
            label = chapter["label"].strip(" -–—|")
            if 2 <= len(label) <= 230 and total not in seen and len(chapters) < 55:
                chapters.append([total, label])
                seen.add(total)
            continue
        if URL.search(line):
            if LINK_LABEL.search(line) and len(links) < 6:
                label = URL.sub("", line).strip(" \t:—-–•►▫️")
                for match in URL.findall(line):
                    address = match.rstrip(".,);!?")
                    try:
                        parsed = urlsplit(address)
                        valid = parsed.hostname and not parsed.username and not parsed.password
                    except ValueError:
                        continue
                    if valid and 3 <= len(label) <= 140 and not any(link[1] == address for link in links):
                        links.append([label, address])
            continue
        if line.startswith(("#", "@", "►", "↓", "👉", "📌", "▫")) or len(line) < 48:
            continue
        if sum(word.startswith(("#", "@")) for word in line.split()) >= 2:
            continue
        if len(paragraphs) < 4:
            paragraphs.append(line)
    notes = " ".join(paragraphs)
    if len(notes) > 1100:
        notes = notes[:1100].rsplit(" ", 1)[0] + "…"
    output = {}
    if notes:
        output["notes"] = notes
    if chapters:
        output["chapters"] = sorted(chapters)
    if links:
        output["links"] = links
    return {"guide": output} if output else {}
