"""CLI entry: python -m app.ingest.demo"""

from __future__ import annotations

from app.process.demo import generate_demo_times


def main() -> None:
    times = generate_demo_times()
    print("Demo assets generated for valid_times:")
    for vt in times:
        print(f"  - {vt}")


if __name__ == "__main__":
    main()
