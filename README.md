# 🚦 VigilantFlow — ANPR Traffic Intelligence System

> An AI-powered traffic intelligence platform for real-time vehicle detection, automatic number plate recognition, vehicle tracking, trajectory analysis, and intelligent alert generation.

VigilantFlow combines computer vision, OCR, tracking, and a modern web dashboard to transform traffic-camera footage into actionable intelligence.

---

## 📌 Overview

Traditional traffic monitoring systems often require continuous manual observation of camera feeds. VigilantFlow automates this process by analyzing traffic videos and extracting useful information such as:

- 🚗 Vehicle detection
- 🪪 Automatic Number Plate Recognition (ANPR)
- 🎯 Vehicle tracking
- 🔗 Vehicle–plate association
- 🧠 Temporal OCR consensus
- 📍 Camera-based trajectory tracking
- 📊 Traffic analytics
- 🚨 Watchlist-based alerts
- 🎥 Annotated video output
- 🌐 Interactive New Delhi map visualization

The system is designed around a **FastAPI backend + React/Vite frontend** architecture.

---

## ✨ Key Features

### 🎥 Multi-Camera Traffic Monitoring

VigilantFlow supports multiple traffic-camera video sources.

Currently configured sources:

```text
cam_1.mp4
cam_2.mp4
cam_3.mp4
