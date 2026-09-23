import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
if (!process.env.FAL_KEY) console.warn("FAL_KEY is not set. Generation will fail until it is configured.");
fal.config({ credentials: process.env.FAL_KEY || "" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }
});

app.use(express.json({limit:"2mb"}));
app.use(express.static(path.join(__dirname,"public")));

function cleanDuration(value) {
  const n = Number(value);
  return n === 10 ? "10" : "5";
}

async function uploadToFal(file) {
  if (!file) return null;
  const f = new File([file.buffer], file.originalname || "upload", {
    type: file.mimetype || "application/octet-stream"
  });
  return await fal.storage.upload(f);
}

function resultVideo(data) {
  return data?.video?.url || data?.output?.video?.url || data?.video?.file?.url || null;
}

app.post("/api/generate", upload.single("media"), async (req,res) => {
  try {
    if (!process.env.FAL_KEY) return res.status(500).json({error:"FAL_KEY is not configured on the server."});

    const mode = req.body.mode || "text";
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) return res.status(400).json({error:"Please enter a prompt."});

    const duration = cleanDuration(req.body.duration);
    let data;

    if (mode === "text") {
      const input = {
        prompt,
        duration,
        generate_audio: req.body.audio === "true"
      };
      data = (await fal.subscribe("fal-ai/kling-video/v3/standard/text-to-video", {
        input, logs: true
      })).data;
    } else if (mode === "image") {
      if (!req.file) return res.status(400).json({error:"Please upload an image."});
      const imageUrl = await uploadToFal(req.file);
      const input = {
        prompt,
        image_url: imageUrl,
        duration,
        generate_audio: req.body.audio === "true"
      };
      data = (await fal.subscribe("fal-ai/kling-video/v3/standard/image-to-video", {
        input, logs: true
      })).data;
    } else if (mode === "video") {
      if (!req.file) return res.status(400).json({error:"Please upload a video."});
      const videoUrl = await uploadToFal(req.file);
      const input = {
        prompt,
        video_url: videoUrl
      };
      data = (await fal.subscribe("fal-ai/kling-video/o3/standard/video-to-video/reference", {
        input, logs: true
      })).data;
    } else {
      return res.status(400).json({error:"Unknown generation mode."});
    }

    const videoUrl = resultVideo(data);
    if (!videoUrl) return res.status(502).json({error:"Provider returned no video URL.", raw:data});
    res.json({ok:true, videoUrl});
  } catch (err) {
    console.error(err);
    res.status(500).json({error: err?.message || "Generation failed."});
  }
});

app.get("*splat", (req,res) => {
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Bharat AI running at http://localhost:${process.env.PORT || 3000}`);
});
