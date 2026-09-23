# Bharat AI — Cinematic Video Studio

A full-stack prototype with real fal.ai generation integration.

Modes:
- Text → Video: Kling Video v3 Standard
- Image → Video: Kling Video v3 Standard
- Video → Video: Kling O3 Standard Reference

The server keeps `FAL_KEY` private and uploads user media to fal storage before sending generation requests. The selected fal models support cinematic video workflows; exact resolution/duration/model capabilities depend on the provider model and account.

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Put your fal API key in `FAL_KEY`.
4. Run `npm install`.
5. Run `npm start`.
6. Open http://localhost:3000

Generation costs are charged by the model/provider; this app does not include a billing system.
