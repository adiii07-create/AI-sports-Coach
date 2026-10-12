from __future__ import annotations

import argparse
import json
import math
import os
import sys
from pathlib import Path

import cv2
import mediapipe as mp

from analysis.badminton.footwork import analyze as analyze_footwork
from analysis.common.geometry import angle, distance


POSE_CONNECTIONS = tuple(mp.solutions.pose.POSE_CONNECTIONS)
LANDMARKS = mp.solutions.pose.PoseLandmark


def point(landmarks, landmark_id) -> tuple[float, float]:
    landmark = landmarks[landmark_id]
    return (float(landmark.x), float(landmark.y))


def run(input_path: Path, output_path: Path, activity: str) -> dict:
    capture = cv2.VideoCapture(str(input_path))
    if not capture.isOpened():
        return {"status": "insufficient_data", "error": "Video could not be read."}
    fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
    frame_total = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
    if width < 2 or height < 2:
        capture.release()
        return {"status": "insufficient_data", "error": "Video dimensions are invalid."}
    writer = cv2.VideoWriter(
        str(output_path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )
    frames: list[dict] = []
    frames_processed = 0
    outside_frames = 0
    with mp.solutions.pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.55,
        min_tracking_confidence=0.55,
    ) as pose:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            frames_processed += 1
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = pose.process(rgb)
            if result.pose_landmarks:
                landmarks = result.pose_landmarks.landmark
                required = [
                    LANDMARKS.LEFT_ANKLE, LANDMARKS.RIGHT_ANKLE,
                    LANDMARKS.LEFT_KNEE, LANDMARKS.RIGHT_KNEE,
                    LANDMARKS.LEFT_HIP, LANDMARKS.RIGHT_HIP,
                    LANDMARKS.LEFT_SHOULDER, LANDMARKS.RIGHT_SHOULDER,
                ]
                visibility_ok = all(landmarks[item].visibility >= 0.45 for item in required)
                ankle_points = (point(landmarks, LANDMARKS.LEFT_ANKLE), point(landmarks, LANDMARKS.RIGHT_ANKLE))
                outside_frames += int(any(
                    value < 0.02 or value > 0.98
                    for ankle in ankle_points for value in ankle
                ))
                if visibility_ok:
                    left_hip, right_hip = point(landmarks, LANDMARKS.LEFT_HIP), point(landmarks, LANDMARKS.RIGHT_HIP)
                    left_shoulder, right_shoulder = point(landmarks, LANDMARKS.LEFT_SHOULDER), point(landmarks, LANDMARKS.RIGHT_SHOULDER)
                    frames.append({
                        "ankles": ankle_points,
                        "knee_angles": [
                            angle(point(landmarks, LANDMARKS.LEFT_HIP), point(landmarks, LANDMARKS.LEFT_KNEE), ankle_points[0]),
                            angle(right_hip, point(landmarks, LANDMARKS.RIGHT_KNEE), ankle_points[1]),
                        ],
                        "torso_scale": distance(left_hip, right_shoulder),
                    })
                mp.solutions.drawing_utils.draw_landmarks(
                    frame, result.pose_landmarks, POSE_CONNECTIONS,
                    landmark_drawing_spec=mp.solutions.drawing_utils.DrawingSpec(
                        color=(80, 255, 80), thickness=2, circle_radius=2
                    ),
                )
                for ankle in ankle_points:
                    cv2.circle(frame, (int(ankle[0] * width), int(ankle[1] * height)), 8, (0, 255, 255), -1)
            writer.write(frame)
    capture.release()
    writer.release()
    duration = frames_processed / fps if fps else 0
    base = {
        "framesProcessed": frames_processed,
        "validPoseFrames": len(frames),
        "videoDurationSeconds": round(duration, 2),
        "detectionStatus": "athlete_detected" if frames else "no_person_detected",
        "processedVideoPath": str(output_path),
    }
    if duration < 5:
        base.update({"status": "insufficient_data", "error": "Your video is too short. Please upload a video at least 5 seconds long."})
        return base
    if duration > 60:
        base.update({"status": "insufficient_data", "error": "Your video is too long. Please upload a video no longer than 60 seconds."})
        return base
    if len(frames) < max(10, math.ceil(frames_processed * 0.2)):
        base.update({
            "status": "insufficient_data",
            "error": "Insufficient video quality for reliable analysis.",
        })
        return base
    if activity != "footwork":
        base.update({
            "status": "processing_unavailable",
            "error": "Analysis under development for this activity.",
        })
        return base
    base.update({"status": "analysis_ready", **analyze_footwork(frames, fps, duration)})
    return base


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--activity", default="footwork")
    args = parser.parse_args()
    try:
        print(json.dumps(run(Path(args.input), Path(args.output), args.activity)))
        return 0
    except Exception as exc:
        print(json.dumps({"status": "insufficient_data", "error": f"Processing failed: {exc}"}))
        return 0


if __name__ == "__main__":
    sys.exit(main())