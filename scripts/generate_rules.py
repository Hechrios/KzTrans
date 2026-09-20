from __future__ import annotations

import json
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Qazaq.xlsx"
OUTPUT = ROOT / "rules.js"
SCRIPTS = (
    "Cn-Ar", "Cn-La", "Cn-Nw", "Cn-Py", "Kz-Cy",
    "Kz-17.0", "Kz-17", "Kz-18", "Kz-21"
)
CYRILLIC_SCRIPTS = ("Kz-17.0", "Kz-17", "Kz-18", "Kz-21")
NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
M = f"{{{NS}}}"


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def shared_strings(archive: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    result: list[str] = []
    for item in root:
        if local(item.tag) != "si":
            continue
        result.append("".join(node.text or "" for node in item.iter() if local(node.tag) == "t"))
    return result


def cell_value(cell: ET.Element, shared: list[str]) -> str:
    cell_type = cell.attrib.get("t", "")
    value = next((node for node in cell if local(node.tag) == "v"), None)
    inline = next((node for node in cell if local(node.tag) == "is"), None)
    if cell_type == "s" and value is not None:
        return shared[int(value.text)]
    if cell_type == "inlineStr" and inline is not None:
        return "".join(node.text or "" for node in inline.iter() if local(node.tag) == "t")
    return value.text if value is not None else ""


def read_rows() -> list[dict[str, str]]:
    with zipfile.ZipFile(SOURCE) as archive:
        shared = shared_strings(archive)
        root = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows: list[dict[str, str]] = []
        for row in root.iter():
            if local(row.tag) != "row":
                continue
            values: dict[str, str] = {}
            for cell in row:
                if local(cell.tag) != "c":
                    continue
                reference = cell.attrib.get("r", "")
                column = "".join(ch for ch in reference if ch.isalpha())
                value = cell_value(cell, shared).strip()
                if value:
                    values[column] = value
            if values:
                rows.append(values)
    return rows


def main() -> None:
    rows = read_rows()
    expected = [rows[0].get(chr(65 + index), "") for index in range(len(SCRIPTS))]
    if expected != list(SCRIPTS):
        raise SystemExit(f"Unexpected Qazaq.xlsx headers: {expected}")

    rules: list[dict[str, str]] = []
    cyrillic_rules: list[dict[str, str]] = []
    for row in rows[1:]:
        canonical = row.get("A", "").strip()
        if canonical and len(canonical) <= 3:
            rule = {"canonical": canonical}
            for index, script in enumerate(SCRIPTS[1:], start=1):
                rule[script] = row.get(chr(65 + index), "").strip()
            rules.append(rule)

        cyrillic = row.get("E", "").strip()
        cyrillic_parts = cyrillic.split()
        if len(cyrillic_parts) == 2 and all(len(part) == 1 for part in cyrillic_parts):
            cyrillic_rule = {"Kz-Cy": cyrillic}
            for index, script in enumerate(CYRILLIC_SCRIPTS, start=5):
                cyrillic_rule[script] = row.get(chr(65 + index), "").strip()
            cyrillic_rules.append(cyrillic_rule)

    payload = json.dumps(rules, ensure_ascii=False, indent=2)
    cyrillic_payload = json.dumps(cyrillic_rules, ensure_ascii=False, indent=2)
    output = f"""// Generated from Qazaq.xlsx by scripts/generate_rules.py.\n(function (root) {{\n  'use strict';\n  const rules = {payload};\n  const cyrillicRules = {cyrillic_payload};\n  root.QAZAQ_RULES = rules;\n  root.QAZAQ_CYRILLIC_RULES = cyrillicRules;\n  if (typeof module !== 'undefined' && module.exports) {{\n    module.exports = rules;\n    module.exports.CYRILLIC_RULES = cyrillicRules;\n  }}\n}})(typeof globalThis !== 'undefined' ? globalThis : this);\n"""
    OUTPUT.write_text(output, encoding="utf-8")
    print(f"Generated {OUTPUT.name} with {len(rules)} mapping rows.")


if __name__ == "__main__":
    main()
