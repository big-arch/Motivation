"""Assemble the journal's source collections and the public refresh report."""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from datetime import datetime, timezone

from update_feeds import ROOT, FEED_ERRORS, clean_text, download, news_entries, public_url, stamp

SECTION_LABELS = {"stories": "Интервью", "museum": "Разбор", "resources": "Практика", "support": "Точка опоры"}
FEEDS = [
    ("Y Combinator", "stories", "https://www.ycombinator.com/blog/rss"),
    ("Cloudflare", "museum", "https://blog.cloudflare.com/tag/post-mortem/rss/"),
    ("Inside GOV.UK", "museum", "https://insidegovuk.blog.gov.uk/category/incident-reports/feed/"),
]
INCIDENT = re.compile(r"банкрот|обанкрот|ликвидаци[яию].{0,25}(?:компани|бренд)|(?:компания|стартап|завод).{1,35}закрыл[ас]|file[ds]? for bankruptcy|in administration|chapter 11 bankrupt|shuts down|went bankrupt", re.I)
FOUNDERS = re.compile(r"how .+ (?:built|became|founded|launched|turned|started|went|forced|cold.emailed)|founder|founding engineer|истори[яию]|основател|конкурент|как .+ (?:открыл|построил|начал|созда|стал|стала|вырос)", re.I)
GUIDE = re.compile(r"how to |guide to |framework for |как (?:начать|проверить|нанять|найти|запустить|построить|провести|управлять|выбрать)|пошагов", re.I)
SKIP = re.compile(r"promo code|gift guide|gifts for |exciting news:|подборка подарков|промокод|анонс|трейлер", re.I)


def canonical(url):
    url = public_url(url)
    if not url:
        return ""
    parsed = urlsplit(url)
    query = [(k,v) for k,v in parse_qsl(parsed.query,keep_blank_values=True)
             if not k.lower().startswith("utm_") and k.lower() not in {"fbclid","gclid","mc_cid","mc_eid"}]
    return urlunsplit((parsed.scheme, parsed.netloc.lower(), parsed.path, urlencode(query), ""))


def insert(groups, group, row, label):
    url = canonical(row["url"])
    if not url or not row["published"] or not row["title"] or SKIP.search(row["title"]):
        return
    item = {k:row[k] for k in ("title","source","published","lang")}
    item.update(url=url, label=label)
    summary = clean_text(row.get("summary",""), 230)
    if summary and summary != item["title"]:
        item["summary"] = summary
    groups[group][url] = item


def section_for(kind, row):
    title, source = row["title"], row["source"]
    if kind == "audio" and source in {"How I Built This","Основатели"} and (
            FOUNDERS.search(title) or source=="How I Built This" and ":" in title):
        return "stories", "Интервью"
    if kind == "news":
        if INCIDENT.search(title):
            return "museum", "Деловая пресса"
        if source in {"Zen Habits","Gretchen Rubin"}:
            return "support", "Колонка автора"
        if source in {"Хабр · Карьера","Inc.","Entrepreneur","Fast Company","MIT Sloan Management Review","Knowledge at Wharton"} and GUIDE.search(title):
            return "resources", "Практическая статья"
    if kind == "videos" and row.get("format")=="full" and row["lang"]=="ru":
        if source in {"Основатели","Бизнес на салфетке"} and FOUNDERS.search(title):
            return "stories", "Видеоинтервью"
        if source in {"Prodcast: Поиск работы и иммиграция в США","Бизнес на салфетке","Marina Mogilko"} and GUIDE.search(title):
            return "resources", "Практический выпуск"
    return None


def write(path, data):
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    temp.replace(path)


def refresh(data_dir, previous_dir=None):
    now = stamp(datetime.now(timezone.utc).isoformat())
    sections = {group:{} for group in SECTION_LABELS}
    checks = {}
    dirs = [data_dir] + ([previous_dir] if previous_dir else [])
    for directory in dirs:
        path = directory/"sections.json"
        if path.exists():
            for group, items in json.loads(path.read_text("utf8"))["sections"].items():
                if group in sections:
                    sections[group].update({row["url"]:row for row in items})
        status = directory/"site-status.json"
        if status.exists():
            checks.update({r["name"]:r.get("checked","") for r in json.loads(status.read_text("utf8")).get("editorialSources",[])})
    stats = {}
    for kind in ("news","videos","audio","open-books"):
        feed = json.loads((data_dir/(kind+".json")).read_text("utf8"))
        if not feed["items"]:
            raise ValueError(f"Empty catalog: {kind}")
        checked = feed.get("attempted",feed["updated"])
        sources = feed["sources"]
        stats[kind] = {"count":len(feed["items"]),"checked":feed["updated"],"attempted":checked,
                       "total":len(sources),"fresh":sum(r.get("checked")==checked for r in sources),
                       "retained":[r["name"] for r in sources if r.get("checked") != checked]}
        for row in feed["items"]:
            match = section_for(kind,row)
            if match:
                group,label = match
                insert(sections,group,row,label)

    def pull(spec):
        name,group,url = spec
        source = {"feed":url,"name":name}
        try:
            rows = news_entries(download(url,timeout=15),source)
            if not rows:
                raise ValueError("Empty source")
            for row in rows:
                if row["published"]<=now and (group!="stories" or FOUNDERS.search(row["title"])):
                    insert(sections, group, {**row,"source":name,"lang":"en"},
                           "Разбор команды" if group=="museum" else "История команды")
            return {"name":name,"checked":now,"ok":True}
        except FEED_ERRORS as error:
            print(f"{name}: retaining earlier entries ({type(error).__name__})")
            return {"name":name,"checked":checks.get(name,""),"ok":False}

    # Each same-section merge runs in a deterministic sequence.
    editorial = [pull(spec) for spec in FEEDS]
    ordered = {k:sorted(v.values(), key=lambda row:(row["published"],row["url"]),reverse=True) for k,v in sections.items()}
    result = {"schema":1,"sections":ordered}
    if not all(ordered.values()):
        raise ValueError("Missing an editorial collection")
    analysis = json.loads((data_dir/"video-analysis.json").read_text("utf8"))
    if not analysis:
        raise ValueError("Missing video guides")
    write(data_dir/"sections.json",result)
    write(data_dir/"site-status.json",{"schema":1,"built":now,"catalogs":stats,
          "guides":len(analysis),"sections":{k:len(v) for k,v in ordered.items()},"editorialSources":editorial})
    print("Editorial collections:",{k:len(v) for k,v in ordered.items()})


if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--data-dir",type=Path,default=ROOT/"data")
    parser.add_argument("--previous-dir",type=Path)
    args=parser.parse_args()
    refresh(args.data_dir,args.previous_dir)
