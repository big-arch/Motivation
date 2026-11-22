"""Index the whole catalog with multilingual sentence embeddings, including older uploads.

Only original source sentences and chapter positions are selected. A later transcript
analysis can supersede this extractive reading without losing the underlying evidence.
"""
import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.request import urlopen

from build_video_analysis import FILE, ROOT, spaced
from video_evidence import editorial_text, usable_excerpt

REV = "2c4055b12046f11709e9df2c122e59ffbdc2f900"
BASE = f"https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2/resolve/{REV}/"
QUESTION = "Какой опыт, конкретное изменение, результат или практический вывод описан участником?"


def fragments(item):
    guide = item.get("guide", {})
    notes = guide.get("notes") or usable_excerpt(item.get("summary"), item["title"])
    rows = []
    for part in re.split(r"(?<=[.!?])\s+|\n", notes):
        sentence = part.strip()
        if (22 <= len(sentence) <= 600 and not sentence.endswith("…")
                and sentence.casefold() != item["title"].strip().casefold() and editorial_text(sentence)):
            rows.append({"text": sentence})
    chapters = guide.get("chapters", [])
    short = item.get("format") == "shorts" or (item.get("platform") == "rutube" and 0 < item.get("duration",0) <= 180)
    if short and any(start >= (item.get("duration") or 180) for start, _ in chapters):
        chapters = []
    for start, label in spaced(chapters, 18):
        if len(label) >= 12 and editorial_text(label):
            rows.append({"text": label, "start": start})
    return list({r["text"]: r for r in rows}.values())


def model_files(cache):
    cache.mkdir(parents=True, exist_ok=True)
    for dest, remote in (("tokenizer.json", "tokenizer.json"), ("model.onnx", "onnx/model_int8.onnx")):
        path = cache / dest
        if path.exists():
            continue
        temp = path.with_suffix(".tmp")
        with urlopen(BASE+remote, timeout=60) as response, temp.open("wb") as out:
            while block := response.read(1024*1024):
                out.write(block)
        temp.replace(path)


def index(cache):
    import numpy as np
    import onnxruntime as ort
    from tokenizers import Tokenizer
    records = json.loads(FILE.read_text("utf8"))
    items = json.loads((ROOT / "data/videos.json").read_text("utf8"))["items"]
    queue = []
    for item in items:
        key = item["platform"]+":"+item["id"]
        old = records.get(key, {})
        if old and old.get("basis") != "outline":
            continue
        rows = fragments(item)
        if not rows:
            if old.get("basis") == "outline":
                del records[key]
            continue
        fingerprint = hashlib.sha256(json.dumps(rows).encode()).hexdigest()[:16]
        if old.get("fingerprint") != fingerprint:
            queue.append((key, item["title"], rows, fingerprint))
    if not queue:
        FILE.write_text(json.dumps(records, ensure_ascii=False, indent=2)+"\n", "utf8")
        return
    model_files(cache)
    tokens = Tokenizer.from_file(str(cache/"tokenizer.json"))
    tokens.enable_truncation(max_length=96)
    tokens.enable_padding(pad_id=0, pad_token="[PAD]")
    options = ort.SessionOptions()
    options.intra_op_num_threads = 3
    engine = ort.InferenceSession(str(cache/"model.onnx"), options, providers=["CPUExecutionProvider"])
    inputs = {i.name for i in engine.get_inputs()}
    def encode(texts):
        encoded = tokens.encode_batch(texts)
        ids = np.array([e.ids for e in encoded], dtype=np.int64)
        mask = np.array([e.attention_mask for e in encoded], dtype=np.int64)
        args = {"input_ids": ids, "attention_mask": mask}
        if "token_type_ids" in inputs:
            args["token_type_ids"] = np.zeros_like(ids)
        vectors = engine.run(None, args)[0]
        if vectors.ndim == 3:
            vectors = np.einsum("bld,bl->bd", vectors, mask) / np.maximum(1, mask.sum(axis=1, keepdims=True))
        return vectors / np.maximum(np.linalg.norm(vectors, axis=1, keepdims=True), 1e-8)
    question = encode([QUESTION])[0]
    for key, title, rows, fingerprint in queue:
        vectors = encode([title]+[r["text"] for r in rows])
        vectors, title_vector = vectors[1:], vectors[0]
        similarity = vectors @ vectors.T
        topic = .55*(vectors @ title_vector) + .45*similarity.mean(axis=1)
        # Prefer a complete author sentence for the lead when one exists.
        narrative = [i for i,r in enumerate(rows) if "start" not in r]
        lead = max(narrative or range(len(rows)), key=lambda i: topic[i])
        selected = [lead]
        relevance = .55*(vectors @ question) + .45*topic
        for _ in range(min(2,len(rows)-1)):
            candidates = [i for i in range(len(rows)) if i not in selected and max(similarity[i,selected])<.88]
            if not candidates:
                break
            selected.append(max(candidates, key=lambda i: relevance[i]-.35*max(similarity[i,selected])))
        records[key] = {"basis":"outline", "summary":rows[lead]["text"],
                        **({"start":rows[lead]["start"]} if "start" in rows[lead] else {}),
                        "points":[rows[i] for i in sorted(selected[1:])], "fingerprint":fingerprint}
    temp = FILE.with_suffix(".tmp")
    temp.write_text(json.dumps(records, ensure_ascii=False, indent=2)+"\n", "utf8")
    temp.replace(FILE)
    print(f"Indexed {len(queue)} videos; {len(records)} readings available.", flush=True)


if __name__ == "__main__":
    index(Path(sys.argv[1]))
