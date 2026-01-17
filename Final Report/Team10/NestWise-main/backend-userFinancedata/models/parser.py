import csv
from dateutil import parser as dateparser


RULES = {
    "food": ["grocery", "supermarket", "aldi", "costco", "whole foods", "starbucks"],
    "transportation": ["uber", "lyft", "shell", "bp", "gas", "transit"],
    "housing": ["rent", "mortgage"],
    "entertainment": ["netflix", "hulu", "spotify"],
}


def categorize(description: str | None):
    if not description:
        return None
    desc = description.lower()
    for cat, keywords in RULES.items():
        for kw in keywords:
            if kw in desc:
                return cat
    return None


def normalize_row(row: dict):
    date_candidates = ["date", "trans_date", "transaction_date", "posted"]
    amount_candidates = ["amount", "amt", "value", "debit", "credit"]
    desc_candidates = ["description", "memo", "merchant", "narration"]

    date_str = next((row[c] for c in date_candidates if c in row and row[c]), None)
    amount_str = next((row[c] for c in amount_candidates if c in row and row[c]), None)
    desc = next((row[c] for c in desc_candidates if c in row and row[c]), None)

    dt = None
    if date_str:
        try:
            dt = dateparser.parse(date_str).date()
        except Exception:
            dt = None

    amt = 0.0
    if amount_str:
        try:
            amt = float(str(amount_str).replace(",", "").strip())
        except Exception:
            amt = 0.0

    category = categorize(desc)

    return {
        "date": dt,
        "amount": amt,
        "description": desc,
        "category": category,
    }


def parse_csv_file(path: str):
    parsed = []
    with open(path, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            parsed.append(normalize_row(row))
    return parsed
