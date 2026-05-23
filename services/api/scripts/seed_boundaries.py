"""Generate simplified admin boundaries (bbox polygons) for offline use.

Natural Earth 110m is preferred when network is available:
  curl -L -o data/boundaries/countries.geojson \\
    https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson

This script seeds bbox-based fallbacks when the file is missing.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BOUNDARIES = ROOT / "data" / "boundaries"

# ISO_A3, English name, Chinese name, west, south, east, north
COUNTRIES: list[tuple[str, str, str, float, float, float, float]] = [
    ("CHN", "China", "中国", 73.0, 18.0, 135.0, 54.0),
    ("USA", "United States", "美国", -125.0, 24.0, -66.0, 49.5),
    ("RUS", "Russia", "俄罗斯", 19.0, 41.0, 180.0, 82.0),
    ("CAN", "Canada", "加拿大", -141.0, 41.0, -52.0, 84.0),
    ("BRA", "Brazil", "巴西", -74.0, -34.0, -34.0, 5.5),
    ("AUS", "Australia", "澳大利亚", 112.0, -44.0, 154.0, -10.0),
    ("IND", "India", "印度", 68.0, 6.0, 97.0, 36.0),
    ("ARG", "Argentina", "阿根廷", -73.5, -55.0, -53.0, -21.5),
    ("KAZ", "Kazakhstan", "哈萨克斯坦", 46.0, 40.0, 87.0, 55.5),
    ("DZA", "Algeria", "阿尔及利亚", -8.5, 18.0, 12.0, 37.5),
    ("COD", "DR Congo", "刚果（金）", 12.0, -13.5, 31.5, 5.5),
    ("SAU", "Saudi Arabia", "沙特阿拉伯", 34.0, 16.0, 56.0, 32.5),
    ("MEX", "Mexico", "墨西哥", -118.0, 14.0, -86.0, 33.0),
    ("IDN", "Indonesia", "印度尼西亚", 95.0, -11.0, 141.0, 6.0),
    ("SDN", "Sudan", "苏丹", 21.5, 8.5, 39.0, 22.5),
    ("LBY", "Libya", "利比亚", 9.0, 19.5, 25.0, 33.5),
    ("IRN", "Iran", "伊朗", 44.0, 25.0, 63.5, 40.0),
    ("MNG", "Mongolia", "蒙古", 87.5, 41.5, 120.0, 52.5),
    ("PER", "Peru", "秘鲁", -81.5, -18.5, -68.5, -0.5),
    ("TCD", "Chad", "乍得", 13.5, 7.0, 24.0, 23.5),
    ("NER", "Niger", "尼日尔", 0.0, 11.5, 16.0, 24.0),
    ("AGO", "Angola", "安哥拉", 11.5, -18.5, 24.0, -4.5),
    ("MLI", "Mali", "马里", -12.5, 10.0, 4.5, 25.0),
    ("ZAF", "South Africa", "南非", 16.0, -35.0, 33.0, -22.0),
    ("COL", "Colombia", "哥伦比亚", -79.5, -4.5, -66.5, 13.5),
    ("ETH", "Ethiopia", "埃塞俄比亚", 33.0, 3.0, 48.0, 15.0),
    ("BOL", "Bolivia", "玻利维亚", -69.5, -23.0, -57.5, -9.5),
    ("MRT", "Mauritania", "毛里塔尼亚", -17.0, 14.5, -4.5, 27.5),
    ("EGY", "Egypt", "埃及", 24.5, 22.0, 37.0, 31.5),
    ("TZA", "Tanzania", "坦桑尼亚", 29.0, -12.0, 40.5, -0.5),
    ("NGA", "Nigeria", "尼日利亚", 2.5, 4.0, 14.5, 14.0),
    ("VEN", "Venezuela", "委内瑞拉", -73.5, 0.5, -59.5, 12.5),
    ("PAK", "Pakistan", "巴基斯坦", 60.5, 23.5, 77.5, 37.0),
    ("CHL", "Chile", "智利", -76.0, -56.0, -66.0, -17.0),
    ("TUR", "Turkey", "土耳其", 26.0, 36.0, 45.0, 42.5),
    ("MMR", "Myanmar", "缅甸", 92.0, 9.5, 101.5, 28.5),
    ("AFG", "Afghanistan", "阿富汗", 60.5, 29.0, 75.0, 38.5),
    ("SOM", "Somalia", "索马里", 41.0, -2.0, 51.5, 12.0),
    ("CAF", "Central African Republic", "中非", 14.0, 2.0, 27.5, 11.0),
    ("UKR", "Ukraine", "乌克兰", 22.0, 44.0, 40.5, 52.5),
    ("MDG", "Madagascar", "马达加斯加", 43.0, -26.0, 50.5, -11.5),
    ("KEN", "Kenya", "肯尼亚", 33.5, -5.0, 42.0, 5.0),
    ("FRA", "France", "法国", -5.0, 41.0, 9.5, 51.5),
    ("DEU", "Germany", "德国", 5.5, 47.0, 15.5, 55.5),
    ("GBR", "United Kingdom", "英国", -8.5, 49.5, 2.0, 61.0),
    ("ITA", "Italy", "意大利", 6.5, 36.0, 18.5, 47.5),
    ("ESP", "Spain", "西班牙", -9.5, 36.0, 4.5, 44.0),
    ("POL", "Poland", "波兰", 14.0, 49.0, 24.5, 55.0),
    ("JPN", "Japan", "日本", 129.0, 30.0, 146.0, 46.0),
    ("KOR", "South Korea", "韩国", 124.5, 33.0, 131.0, 38.5),
    ("PRK", "North Korea", "朝鲜", 124.0, 37.5, 130.5, 43.0),
    ("VNM", "Vietnam", "越南", 102.0, 8.5, 110.0, 23.5),
    ("THA", "Thailand", "泰国", 97.0, 5.5, 106.0, 20.5),
    ("PHL", "Philippines", "菲律宾", 116.0, 4.5, 127.0, 21.0),
    ("MYS", "Malaysia", "马来西亚", 99.5, 0.5, 119.5, 7.5),
    ("NPL", "Nepal", "尼泊尔", 80.0, 26.5, 88.5, 30.5),
    ("BGD", "Bangladesh", "孟加拉国", 88.0, 20.5, 92.5, 26.5),
    ("IRQ", "Iraq", "伊拉克", 38.5, 29.0, 49.0, 37.5),
    ("SYR", "Syria", "叙利亚", 35.5, 32.5, 42.5, 37.5),
    ("YEM", "Yemen", "也门", 42.0, 12.0, 54.5, 19.0),
    ("MAR", "Morocco", "摩洛哥", -13.0, 27.5, -1.0, 36.0),
    ("ZWE", "Zimbabwe", "津巴布韦", 25.0, -22.5, 33.0, -15.5),
    ("NAM", "Namibia", "纳米比亚", 11.5, -29.0, 25.0, -16.5),
    ("BWA", "Botswana", "博茨瓦纳", 19.5, -27.0, 29.5, -17.5),
    ("FIN", "Finland", "芬兰", 20.0, 59.5, 31.5, 70.5),
    ("SWE", "Sweden", "瑞典", 11.0, 55.0, 24.5, 69.0),
    ("NOR", "Norway", "挪威", 4.5, 58.0, 31.0, 71.5),
    ("NZL", "New Zealand", "新西兰", 166.0, -47.5, 178.5, -34.0),
    ("GRL", "Greenland", "格陵兰", -73.0, 59.5, -12.0, 84.0),
]

CHINA_PROVINCES: list[tuple[str, str, str, float, float, float, float]] = [
    ("CN-BJ", "Beijing", "北京", 115.4, 39.4, 117.5, 41.1),
    ("CN-TJ", "Tianjin", "天津", 116.7, 38.5, 118.1, 40.3),
    ("CN-HE", "Hebei", "河北", 113.4, 36.0, 119.9, 42.6),
    ("CN-SX", "Shanxi", "山西", 110.2, 34.6, 114.6, 40.7),
    ("CN-NM", "Inner Mongolia", "内蒙古", 97.2, 37.4, 126.0, 53.3),
    ("CN-LN", "Liaoning", "辽宁", 118.8, 38.7, 125.8, 43.5),
    ("CN-JL", "Jilin", "吉林", 121.6, 40.9, 131.2, 46.3),
    ("CN-HL", "Heilongjiang", "黑龙江", 121.2, 43.4, 135.1, 53.6),
    ("CN-SH", "Shanghai", "上海", 120.9, 30.7, 122.0, 31.9),
    ("CN-JS", "Jiangsu", "江苏", 116.4, 30.8, 121.9, 35.1),
    ("CN-ZJ", "Zhejiang", "浙江", 118.0, 27.0, 123.0, 31.2),
    ("CN-AH", "Anhui", "安徽", 114.9, 29.4, 119.7, 34.7),
    ("CN-FJ", "Fujian", "福建", 115.8, 23.5, 120.7, 28.3),
    ("CN-JX", "Jiangxi", "江西", 113.6, 24.5, 118.5, 30.1),
    ("CN-SD", "Shandong", "山东", 114.8, 34.4, 122.7, 38.4),
    ("CN-HA", "Henan", "河南", 110.4, 31.4, 116.7, 36.4),
    ("CN-HB", "Hubei", "湖北", 108.4, 29.0, 116.1, 33.3),
    ("CN-HN", "Hunan", "湖南", 108.8, 24.6, 114.3, 30.1),
    ("CN-GD", "Guangdong", "广东", 109.7, 20.2, 117.3, 25.5),
    ("CN-GX", "Guangxi", "广西", 104.5, 20.9, 112.1, 26.4),
    ("CN-HI", "Hainan", "海南", 108.6, 18.2, 111.1, 20.2),
    ("CN-CQ", "Chongqing", "重庆", 105.3, 28.2, 110.2, 32.2),
    ("CN-SC", "Sichuan", "四川", 97.3, 26.0, 108.5, 34.3),
    ("CN-GZ", "Guizhou", "贵州", 103.6, 24.6, 109.6, 29.2),
    ("CN-YN", "Yunnan", "云南", 97.5, 21.1, 106.2, 29.2),
    ("CN-XZ", "Tibet", "西藏", 78.4, 26.9, 99.1, 36.5),
    ("CN-SN", "Shaanxi", "陕西", 105.5, 31.7, 111.3, 39.6),
    ("CN-GS", "Gansu", "甘肃", 92.3, 32.6, 108.7, 42.8),
    ("CN-QH", "Qinghai", "青海", 89.4, 31.6, 103.0, 39.2),
    ("CN-NX", "Ningxia", "宁夏", 104.3, 35.2, 107.6, 39.4),
    ("CN-XJ", "Xinjiang", "新疆", 73.5, 34.3, 96.4, 49.2),
    ("CN-TW", "Taiwan", "台湾", 119.3, 21.9, 122.0, 25.3),
    ("CN-HK", "Hong Kong", "香港", 113.8, 22.15, 114.4, 22.56),
    ("CN-MO", "Macau", "澳门", 113.53, 22.11, 113.59, 22.22),
]


def _bbox_feature(
    region_id: str,
    name_en: str,
    name_zh: str,
    west: float,
    south: float,
    east: float,
    north: float,
) -> dict:
    return {
        "type": "Feature",
        "properties": {
            "id": region_id,
            "name": name_en,
            "name_zh": name_zh,
            "admin_level": "country" if len(region_id) == 3 else "province",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [west, south],
                    [east, south],
                    [east, north],
                    [west, north],
                    [west, south],
                ]
            ],
        },
    }


def write_geojson(path: Path, features: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    collection = {"type": "FeatureCollection", "features": features}
    path.write_text(json.dumps(collection, ensure_ascii=False), encoding="utf-8")


def main() -> None:
    countries_path = BOUNDARIES / "countries.geojson"
    if not countries_path.exists():
        features = [
            _bbox_feature(rid, en, zh, w, s, e, n)
            for rid, en, zh, w, s, e, n in COUNTRIES
        ]
        write_geojson(countries_path, features)
        print(f"Wrote {countries_path} ({len(features)} countries)")

    provinces_path = BOUNDARIES / "china_provinces.geojson"
    if not provinces_path.exists():
        features = [
            _bbox_feature(rid, en, zh, w, s, e, n)
            for rid, en, zh, w, s, e, n in CHINA_PROVINCES
        ]
        write_geojson(provinces_path, features)
        print(f"Wrote {provinces_path} ({len(features)} provinces)")

    license_path = BOUNDARIES / "LICENSE.md"
    if not license_path.exists():
        license_path.write_text(
            "# Boundary data\n\n"
            "- Preferred: [Natural Earth](https://www.naturalearthdata.com/) "
            "110m Admin 0 countries (public domain).\n"
            "- Fallback `countries.geojson` / `china_provinces.geojson` in this repo "
            "are simplified bounding boxes generated by `services/api/scripts/seed_boundaries.py` "
            "for offline development only.\n",
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
