from __future__ import annotations

from analysis.common.geometry import clamp_score, distance, mean
from analysis.scoring.scoring import (
    score_balance,
    score_footwork,
    score_knees,
    score_recovery,
)


def analyze(frames: list[dict], fps: float, duration: float) -> dict:
    ankles = [frame["ankles"] for frame in frames]
    feet_centers = [
        ((pair[0][0] + pair[1][0]) / 2, (pair[0][1] + pair[1][1]) / 2)
        for pair in ankles
    ]
    total_left = sum(distance(ankles[i - 1][0], ankles[i][0]) for i in range(1, len(ankles)))
    total_right = sum(distance(ankles[i - 1][1], ankles[i][1]) for i in range(1, len(ankles)))
    total_distance = total_left + total_right
    center = (
        mean(point[0] for point in feet_centers) or 0.5,
        mean(point[1] for point in feet_centers) or 0.8,
    )
    torso_scales = [frame["torso_scale"] for frame in frames]
    torso_scale = mean(torso_scales) or 0.2
    center_distances = [distance(point, center) for point in feet_centers]
    variation = (
        max(center_distances) - min(center_distances)
        if center_distances
        else 1.0
    )
    knees = [value for frame in frames for value in frame["knee_angles"]]
    average_knee = mean(knees)
    minimum_knee = min(knees) if knees else None
    maximum_knee = max(knees) if knees else None
    improving_steps = sum(
        center_distances[i] < center_distances[i - 1]
        for i in range(1, len(center_distances))
        if center_distances[i - 1] > torso_scale * 0.45
    )
    recovery_steps = sum(
        1 for i in range(1, len(center_distances))
        if center_distances[i - 1] > torso_scale * 0.45
    )
    scores = {
        "footwork": score_footwork(total_distance, len(frames), torso_scale),
        "balance": score_balance(variation, torso_scale),
        "knee-position": score_knees(average_knee),
        "recovery": score_recovery(improving_steps, recovery_steps),
    }
    labels = {
        "footwork": "Footwork",
        "balance": "Balance",
        "knee-position": "Knee Position",
        "recovery": "Recovery",
    }
    values = {
        "footwork": (total_distance, "normalized movement"),
        "balance": (variation, "normalized sway"),
        "knee-position": (average_knee, "degrees"),
        "recovery": (improving_steps / recovery_steps if recovery_steps else None, "ratio"),
    }
    metrics = []
    for key, label in labels.items():
        score = scores[key]
        value, unit = values[key]
        metrics.append({
            "key": key,
            "label": label,
            "score": score,
            "value": round(value, 3) if value is not None else None,
            "unit": unit,
            "status": "measured" if score is not None else "insufficient_data",
        })
    measured_scores = [score for score in scores.values() if score is not None]
    overall = round(sum(measured_scores) / len(measured_scores)) if len(measured_scores) == 4 else None

    strengths: list[str] = []
    improvements: list[str] = []
    feedback: list[str] = []
    practice: list[str] = []
    if scores["footwork"] is not None and scores["footwork"] >= 70:
        strengths.append("Your feet covered a consistent amount of space during the drill.")
    elif scores["footwork"] is not None:
        improvements.append("Your foot movement covered a smaller range than expected in this drill.")
        feedback.append("Try making each movement deliberately reach the outside marker before recovering.")
        practice.append("Repeat a four-corner drill with visible floor markers and a steady tempo.")
    if scores["balance"] is not None and scores["balance"] >= 70:
        strengths.append("Your body stayed relatively centered while your feet moved.")
    elif scores["balance"] is not None:
        improvements.append("Your body position moved noticeably as you changed direction.")
        feedback.append("Focus on keeping your hips controlled over your base as you change direction.")
        practice.append("Practice side-to-side movement at half speed, pausing in a stable ready position.")
    if scores["knee-position"] is not None and scores["knee-position"] >= 70:
        strengths.append("Your knee angles stayed within a controlled athletic range.")
    elif scores["knee-position"] is not None:
        improvements.append("Your knee position moved away from a controlled bend during the clip.")
        feedback.append("Keep a soft, controlled knee bend instead of standing tall through the movement.")
        practice.append("Hold a ready-position split step for three seconds between each direction.")
    if scores["recovery"] is not None and scores["recovery"] < 60:
        improvements.append("Your return toward the center was inconsistent after movement.")
        feedback.append("Focus on returning toward the center immediately after reaching the movement position.")
        practice.append("Use a four-corner drill with an explicit center touch after every corner.")
    elif scores["recovery"] is not None:
        strengths.append("Your tracked movement showed repeated returns toward the center.")
    if not feedback:
        feedback.append("Your measured movement was consistent across the tracked frames. Repeat the drill from the same camera position to compare sessions.")
    if not practice:
        practice.append("Repeat this drill twice more and compare how the same metrics change over time.")

    return {
        "overallScore": overall,
        "metrics": metrics,
        "strengths": strengths,
        "improvements": improvements,
        "feedback": feedback,
        "practice": practice,
        "analysisValues": {
            "leftFootMovement": round(total_left, 3),
            "rightFootMovement": round(total_right, 3),
            "averageKneeAngle": round(average_knee, 2) if average_knee is not None else None,
            "minimumKneeAngle": round(minimum_knee, 2) if minimum_knee is not None else None,
            "maximumKneeAngle": round(maximum_knee, 2) if maximum_knee is not None else None,
            "movementSpeed": round(total_distance / max(duration, 0.001), 3),
            "fps": round(fps, 2),
        },
    }