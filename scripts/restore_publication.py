"""Restore a complete public baseline before refreshing catalogs for Pages."""
import argparse
import json
from pathlib import Path
from urllib.error import HTTPError

from update_feeds import download

BASE = "https://big-arch.github.io/Motivation/data/"

def restore(target):
    target.mkdir(parents=True,exist_ok=True)
    for name in ("news","videos","audio","open-books","video-analysis","sections","site-status"):
        try:
            raw = download(BASE+name+".json")
        except HTTPError as e:
            if name in {"sections","site-status"} and e.code==404:
                continue  # The first publication predates the sections feed.
            raise
        data = json.loads(raw)
        if name in {"news","videos","audio","open-books"}:
            valid = data.get("schema")==2 and data.get("items") and data.get("sources")
        elif name == "sections":
            valid = data.get("schema")==1 and data.get("sections")
        elif name == "site-status":
            valid = data.get("schema")==1 and data.get("catalogs")
        else:
            valid = isinstance(data,dict) and bool(data)
        if not valid:
            raise ValueError(f"Incomplete published baseline: {name}")
        (target/(name+".json")).write_bytes(raw)
    print("Restored published catalogs.")

if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("directory",type=Path)
    restore(parser.parse_args().directory)
