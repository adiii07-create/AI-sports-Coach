from __future__ import annotations

import math
from typing import Iterable


Point = tuple[float, float]


def distance(a: Point, b: Point) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def angle(a: Point, vertex: Point, c: Point) -> float:
    """Angle at vertex in degrees, using three normalized landmark points."""
    ax, ay = a[0] - vertex[0], a[1] - vertex[1]
    cx, cy = c[0] - vertex[0], c[1] - vertex[1]
    denominator = math.hypot(ax, ay) * math.hypot(cx, cy)
    if denominator == 0:
        return float("nan")
    cosine = max(-1.0, min(1.0, (ax * cx + ay * cy) / denominator))
    return math.degrees(math.acos(cosine))


def mean(values: Iterable[float]) -> float | None:
    valid = [value for value in values if math.isfinite(value)]
    return sum(valid) / len(valid) if valid else None


def clamp_score(value: float) -> int:
    return max(0, min(100, round(value)))