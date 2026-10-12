from __future__ import annotations

from analysis.common.geometry import clamp_score


def score_footwork(total_distance: float, frame_count: int, torso_scale: float) -> int:
    movement_per_frame = total_distance / max(frame_count, 1)
    return clamp_score(100 * min(1.0, movement_per_frame / max(torso_scale * 0.012, 0.001)))


def score_balance(variation: float, torso_scale: float) -> int:
    relative_variation = variation / max(torso_scale, 0.001)
    return clamp_score(100 - relative_variation * 220)


def score_knees(average_angle: float | None) -> int | None:
    if average_angle is None:
        return None
    # A controlled athletic bend is treated as a broad 115–165 degree range.
    distance_from_target = abs(average_angle - 140)
    return clamp_score(100 - distance_from_target * 1.8)


def score_recovery(improving_steps: int, measured_steps: int) -> int | None:
    if measured_steps < 3:
        return None
    return clamp_score(100 * improving_steps / measured_steps)