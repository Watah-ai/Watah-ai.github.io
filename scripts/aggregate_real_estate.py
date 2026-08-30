"""Aggregate Taichung government real-price CSV into a small web dataset."""

from __future__ import annotations

import csv
import json
import math
import sys
from collections import defaultdict
from pathlib import Path
from statistics import median


def number(value: str) -> float | None:
    try:
        parsed = float(value)
        return parsed if math.isfinite(parsed) else None
    except (TypeError, ValueError):
        return None


def building_group(value: str) -> str | None:
    if "住宅大樓" in value:
        return "住宅大樓"
    if "華廈" in value:
        return "華廈"
    if "公寓" in value:
        return "公寓"
    if "透天" in value:
        return "透天厝"
    return None


def rounded_median(values: list[float], digits: int = 1) -> float:
    return round(median(values), digits)


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: aggregate_real_estate.py INPUT.csv [INPUT.csv ...] OUTPUT.json")

    input_paths = [Path(value) for value in sys.argv[1:-1]]
    output_path = Path(sys.argv[-1])
    buckets: dict[tuple[str, str, int], list[dict[str, float]]] = defaultdict(list)
    district_buckets: dict[str, list[dict[str, float]]] = defaultdict(list)
    accepted = 0

    for input_path in input_paths:
        with input_path.open("r", encoding="utf-8-sig", newline="") as source:
            for row in csv.DictReader(source):
                district = row.get("鄉鎮市區", "").strip()
                group = building_group(row.get("建物型態", ""))
                purpose = row.get("主要用途", "")
                rooms = int(number(row.get("建物現況格局-房", "")) or 0)
                total_ntd = number(row.get("總價-元", ""))
                unit_sqm = number(row.get("單價-每平方公尺", ""))
                area_sqm = number(row.get("建物移轉總面積-平方公尺", ""))
                age = number(row.get("屋齡", ""))

                if not district or not group or "住家" not in purpose:
                    continue
                if not (1 <= rooms <= 5):
                    continue
                if total_ntd is None or unit_sqm is None or area_sqm is None:
                    continue
                if not (1_000_000 <= total_ntd <= 100_000_000):
                    continue
                if not (20_000 <= unit_sqm <= 500_000 and 10 <= area_sqm <= 350):
                    continue

                item = {
                    "totalWan": total_ntd / 10_000,
                    "unitWanPing": unit_sqm * 3.305785 / 10_000,
                    "areaPing": area_sqm / 3.305785,
                    "age": max(age or 0, 0),
                    "parking": 1 if row.get("車位類別", "").strip() else 0,
                }
                buckets[(district, group, rooms)].append(item)
                district_buckets[district].append(item)
                accepted += 1

    profiles = []
    for (district, group, rooms), items in buckets.items():
        if len(items) < 12:
            continue
        totals = [item["totalWan"] for item in items]
        profiles.append(
            {
                "district": district,
                "building": group,
                "rooms": rooms,
                "count": len(items),
                "medianTotalWan": rounded_median(totals, 0),
                "lowTotalWan": round(sorted(totals)[max(0, int(len(totals) * 0.25) - 1)]),
                "highTotalWan": round(sorted(totals)[min(len(totals) - 1, int(len(totals) * 0.75))]),
                "medianUnitWanPing": rounded_median([item["unitWanPing"] for item in items]),
                "medianAreaPing": rounded_median([item["areaPing"] for item in items]),
                "medianAge": rounded_median([item["age"] for item in items], 0),
                "parkingShare": round(sum(item["parking"] for item in items) / len(items), 2),
            }
        )

    districts = []
    for district, items in district_buckets.items():
        districts.append(
            {
                "district": district,
                "count": len(items),
                "medianTotalWan": rounded_median([item["totalWan"] for item in items], 0),
                "medianUnitWanPing": rounded_median([item["unitWanPing"] for item in items]),
            }
        )

    payload = {
        "metadata": {
            "title": "臺中市不動產實價登錄資訊－115年買賣案件（上半年）",
            "source": "臺中市政府地政局／政府資料開放平臺",
            "sourceUrl": "https://data.gov.tw/dataset/103038",
            "license": "政府資料開放授權條款－第1版",
            "period": "2026-01-01 至 2026-06-30",
            "generatedFromRows": accepted,
            "note": "僅保留住家用途、常見住宅型態與合理數值範圍，統計不等同即時待售行情或銀行鑑價。",
        },
        "districts": sorted(districts, key=lambda row: row["medianUnitWanPing"], reverse=True),
        "profiles": sorted(profiles, key=lambda row: (row["district"], row["building"], row["rooms"])),
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {len(profiles)} profiles from {accepted} rows to {output_path}")


if __name__ == "__main__":
    main()
