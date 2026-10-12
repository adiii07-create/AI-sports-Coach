import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { constants as fsConstants, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { Request } from "express";
import {
  AnalyzeVideoBody,
  AnalyzeVideoResponse,
  ListActivitiesResponse,
  ListSportsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const processedVideos = new Map<string, { bytes: Buffer; expiresAt: number }>();
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

function cleanupProcessedVideos() {
  const now = Date.now();
  for (const [id, video] of processedVideos) {
    if (video.expiresAt <= now) processedVideos.delete(id);
  }
}

function emptyMetrics() {
  return ["Footwork", "Balance", "Knee Position", "Recovery"].map((label) => ({
    key: label.toLowerCase().replaceAll(" ", "-"),
    label,
    score: null,
    value: null,
    unit: null,
    status: "insufficient_data" as const,
  }));
}

function isVideoRequest(req: Request) {
  return Buffer.isBuffer(req.body) && req.body.length > 0;
}

async function processVideo(inputPath: string, outputPath: string, activity: string) {
  // The API workflow can start with a different cwd in deployment. Resolve
  // from the built server location first, then allow an explicit override.
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(serverDir, "../../..");
  const pythonCandidates = [
    process.env.PYTHON_BIN,
    path.join(projectRoot, ".pythonlibs", "bin", "python"),
    path.join(projectRoot, ".pythonlibs", "bin", "python3"),
    path.join(process.cwd(), ".pythonlibs", "bin", "python"),
    "python3",
  ].filter((candidate): candidate is string => Boolean(candidate));
  let python: string | undefined;
  for (const candidate of pythonCandidates) {
    if (!path.isAbsolute(candidate)) {
      python = candidate;
      break;
    }
    try {
      await fs.access(candidate, fsConstants.X_OK);
      python = candidate;
      break;
    } catch {
      // Try the next runtime location.
    }
  }
  if (!python) {
    throw new Error("Python runtime was not found. Configure PYTHON_BIN or install the project Python environment.");
  }
  const script = path.join(projectRoot, "analysis", "analyze_video.py");
  const child = spawn(python, [script, "--input", inputPath, "--output", outputPath, "--activity", activity], {
    cwd: projectRoot,
    env: { ...process.env, PYTHONPATH: projectRoot },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  const code = await new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (exitCode) => resolve(exitCode));
  });
  const line = stdout.trim().split("\n").filter(Boolean).at(-1);
  if (!line) throw new Error(stderr || `Pose processor exited with code ${code}.`);
  return JSON.parse(line) as Record<string, unknown>;
}

const sports = [
  {
    slug: "badminton",
    name: "Badminton",
    description: "Analyze movement and footwork during badminton training.",
    status: "available" as const,
    icon: "racket",
  },
  {
    slug: "cricket",
    name: "Cricket",
    description: "Build a stronger foundation for batting, bowling and fielding.",
    status: "coming_soon" as const,
    icon: "cricket",
  },
  {
    slug: "football",
    name: "Football",
    description: "Turn structured drills into sharper movement and control.",
    status: "coming_soon" as const,
    icon: "football",
  },
  {
    slug: "basketball",
    name: "Basketball",
    description: "Develop repeatable movement patterns for the court.",
    status: "coming_soon" as const,
    icon: "basketball",
  },
  {
    slug: "tennis",
    name: "Tennis",
    description: "Practice the footwork behind every confident shot.",
    status: "coming_soon" as const,
    icon: "tennis",
  },
  {
    slug: "athletics",
    name: "Athletics",
    description: "Train efficient movement for running and agility drills.",
    status: "coming_soon" as const,
    icon: "athletics",
  },
];

const activitiesBySport = {
  badminton: [
    {
      slug: "footwork",
      name: "Footwork Analysis",
      description:
        "Analyze foot placement, balance, movement and recovery during a badminton footwork drill.",
      status: "available" as const,
      durationSeconds: 30,
      instructions: [
        "Place your phone at waist height, about 4–5 metres away.",
        "Use a stable landscape orientation with your whole body in frame.",
        "Make sure your practice area and lighting are clear.",
        "Perform the four-corner drill and recover to the centre each time.",
        "Keep the clip short so your movement stays visible and focused.",
      ],
    },
    {
      slug: "smash",
      name: "Smash Technique",
      description: "Build a repeatable overhead movement with guided feedback.",
      status: "coming_soon" as const,
      durationSeconds: 30,
      instructions: [],
    },
    {
      slug: "serve",
      name: "Serve Technique",
      description: "Review the setup and rhythm of your badminton serve.",
      status: "coming_soon" as const,
      durationSeconds: 30,
      instructions: [],
    },
    {
      slug: "defensive-movement",
      name: "Defensive Movement",
      description: "Train the movement patterns that help you stay ready.",
      status: "coming_soon" as const,
      durationSeconds: 30,
      instructions: [],
    },
    {
      slug: "net-movement",
      name: "Net Movement",
      description: "Practice controlled movement into and away from the net.",
      status: "coming_soon" as const,
      durationSeconds: 30,
      instructions: [],
    },
  ],
} as const;

router.get("/sports", (_req, res) => {
  res.json(ListSportsResponse.parse(sports));
});

router.get("/sports/:sportSlug/activities", (req, res) => {
  const activities =
    activitiesBySport[req.params.sportSlug as keyof typeof activitiesBySport];
  if (!activities) {
    res.status(404).json({ error: "Sport not found." });
    return;
  }
  res.json(ListActivitiesResponse.parse(activities));
});

router.post("/analysis", (req, res) => {
  const parsed = AnalyzeVideoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Provide a valid sport, activity and video." });
    return;
  }

  const isSupported =
    parsed.data.sportSlug === "badminton" &&
    parsed.data.activitySlug === "footwork";

  const result = {
    id: randomUUID(),
    status: "processing_unavailable" as const,
    sportSlug: parsed.data.sportSlug,
    activitySlug: parsed.data.activitySlug,
    overallScore: null,
    metrics: [
      "Footwork",
      "Balance",
      "Knee Position",
      "Recovery",
    ].map((label) => ({
      key: label.toLowerCase().replace(" ", "-"),
      label,
      score: null,
      value: null,
      unit: null,
      status: "insufficient_data" as const,
    })),
    strengths: [],
    improvements: [],
    feedback: [],
    practice: [],
    processedVideoUrl: null,
    note: isSupported
      ? "Video received. Pose processing is not available in this environment yet, so no score or coaching claims were generated."
      : "This sport and activity module is still under development.",
  };

  res.json(AnalyzeVideoResponse.parse(result));
});

router.post("/analysis/upload", async (req, res) => {
  const sportSlug = String(req.header("sportSlug") ?? "");
  const activitySlug = String(req.header("activitySlug") ?? "");
  if (!sportSlug || !activitySlug) {
    res.status(400).json({ error: "Sport and activity headers are required." });
    return;
  }
  if (!isVideoRequest(req)) {
    res.status(400).json({ error: "Upload a video file to start analysis." });
    return;
  }
  if (req.body.length > MAX_VIDEO_BYTES) {
    res.status(413).json({ error: "That video is over the 250 MB limit." });
    return;
  }
  const id = randomUUID();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "rally-coach-"));
  const inputPath = path.join(tempDir, "input-video");
  const outputPath = path.join(tempDir, "processed.mp4");
  try {
    await fs.writeFile(inputPath, req.body);
    const analysis = await processVideo(inputPath, outputPath, activitySlug);
    const processed = await fs.readFile(outputPath).catch(() => null);
    if (processed) {
      processedVideos.set(id, { bytes: processed, expiresAt: Date.now() + 30 * 60 * 1000 });
    }
    cleanupProcessedVideos();
    const status = analysis.status === "analysis_ready"
      ? "analysis_ready"
      : analysis.status === "processing_unavailable"
        ? "processing_unavailable"
        : "insufficient_data";
    const result = {
      id,
      status,
      sportSlug,
      activitySlug,
      overallScore: typeof analysis.overallScore === "number" ? analysis.overallScore : null,
      metrics: Array.isArray(analysis.metrics) ? analysis.metrics : emptyMetrics(),
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements : [],
      feedback: Array.isArray(analysis.feedback) ? analysis.feedback : [],
      practice: Array.isArray(analysis.practice) ? analysis.practice : [],
      processedVideoUrl: processed ? `/api/analysis/${id}/video` : null,
      note: typeof analysis.error === "string"
        ? analysis.error
        : status === "analysis_ready"
          ? "Pose landmarks were detected and the scores below are calculated from this video."
          : "Insufficient video data for reliable analysis.",
      videoDurationSeconds: typeof analysis.videoDurationSeconds === "number" ? analysis.videoDurationSeconds : null,
      framesProcessed: typeof analysis.framesProcessed === "number" ? analysis.framesProcessed : 0,
      validPoseFrames: typeof analysis.validPoseFrames === "number" ? analysis.validPoseFrames : 0,
      detectionStatus: typeof analysis.detectionStatus === "string" ? analysis.detectionStatus : "not_processed",
    };
    res.json(AnalyzeVideoResponse.parse(result));
  } catch (error) {
    res.status(422).json({ error: error instanceof Error ? error.message : "Video processing failed." });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

router.get("/analysis/:id/video", (req, res) => {
  cleanupProcessedVideos();
  const video = processedVideos.get(req.params.id);
  if (!video) {
    res.status(404).json({ error: "Processed video is no longer available." });
    return;
  }
  res.type("video/mp4").set("Cache-Control", "private, max-age=1800").send(video.bytes);
});

export default router;