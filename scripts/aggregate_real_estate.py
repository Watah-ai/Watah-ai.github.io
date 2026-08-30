"""Aggregate Taichung government real-price CSV into a small web dataset."""

from __future__ import annotations

import calendar
import csv
import json
import math
import re
import sys
from collections import defaultdict
from datetime import date
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


def coverage_from_inputs(input_paths: list[Path]) -> dict[str, str]:
    parsed: list[tuple[int, int]] = []
    for input_path in input_paths:
        match = re.fullmatch(r"(?P<roc_year>\d{3})-q(?P<quarter>[1-4])", input_path.stem, re.IGNORECASE)
        if not match:
            raise SystemExit(
                f"cannot derive coverage from {input_path.name}; "
                "use filenames such as 115-q1.csv"
            )
        parsed.append((int(match.group("roc_year")), int(match.group("quarter"))))

    roc_years = {item[0] for item in parsed}
    if len(roc_years) != 1:
        raise SystemExit("all input files must belong to the same ROC calendar year")

    quarters = sorted({item[1] for item in parsed})
    if len(quarters) != len(parsed):
        raise SystemExit("input quarters must not contain duplicates")
    expected = list(range(quarters[0], quarters[-1] + 1))
    if quarters != expected:
        raise SystemExit("input quarters must be consecutive")

    roc_year = roc_years.pop()
    year = roc_year + 1911
    start_month = (quarters[0] - 1) * 3 + 1
    end_month = quarters[-1] * 3
    coverage_start = date(year, start_month, 1)
    coverage_end = date(year, end_month, calendar.monthrange(year, end_month)[1])

    if quarters == [1, 2]:
        short_period_label = f"{year} H1"
    elif quarters == [3, 4]:
        short_period_label = f"{year} H2"
    elif quarters == [1, 2, 3, 4]:
        short_period_label = str(year)
    elif len(quarters) == 1:
        short_period_label = f"{year} Q{quarters[0]}"
    else:
        short_period_label = f"{year} Q{quarters[0]}–Q{quarters[-1]}"

    quarter_title = f"第{quarters[0]}季" if len(quarters) == 1 else f"第{quarters[0]}季至第{quarters[-1]}季"
    return {
        "title": f"臺中市不動產實價登錄資訊－{roc_year}年買賣案件（{quarter_title}）",
        "coverageStart": coverage_start.isoformat(),
        "coverageEnd": coverage_end.isoformat(),
        "period": f"{coverage_start.isoformat()} 至 {coverage_end.isoformat()}",
        "periodLabel": f"{year} 年 {start_month}–{end_month} 月",
        "shortPeriodLabel": short_period_label,
    }


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: aggregate_real_estate.py INPUT.csv [INPUT.csv ...] OUTPUT.json")

    input_paths = [Path(value) for value in sys.argv[1:-1]]
    output_path = Path(sys.argv[-1])
    coverage = coverage_from_inputs(input_paths)
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
            "title": coverage["title"],
            "source": "臺中市政府地政局／政府資料開放平臺",
            "sourceUrl": "https://data.gov.tw/dataset/103038",
            "license": "政府資料開放授權條款－第1版",
            "coverageStart": coverage["coverageStart"],
            "coverageEnd": coverage["coverageEnd"],
            "period": coverage["period"],
            "periodLabel": coverage["periodLabel"],
            "shortPeriodLabel": coverage["shortPeriodLabel"],
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
