"""Puzzle configuration — loads from puzzle_config.json for easy customization."""

import json
from pathlib import Path

_config_path = Path(__file__).parent.parent / "puzzle_config.json"

with open(_config_path, encoding="utf-8") as f:
    _raw = json.load(f)

# Convert string keys to int keys
PUZZLES: dict[int, dict] = {int(k): v for k, v in _raw["puzzles"].items()}

TOTAL_STAGES = len(PUZZLES)
