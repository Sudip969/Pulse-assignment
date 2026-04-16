# Pulse: Enterprise Video Streaming & Analysis

## 1. Documentation Package Overview
A comprehensive full-stack application that enables users to upload videos, processes them for content sensitivity analysis, and provides robust video streaming capabilities with real-time progress tracking.

This document serves as the complete **Documentation Package** addressing installation, API specifications, user manual, architecture overviews, and design assumptions.

---

## 2. Installation and Setup Guide

### System Prerequisites
- **Node.js** v16 or higher
- **MongoDB** Instance (Local or MongoDB Atlas)

### Setup Instructions

1. **Clone and Database Configuration**
Ensure you have a MongoDB cluster ready. Open `/backend/.env` and configure the following variables:
- `MONGO_URI`: Your MongoDB connection string.
- `JWT_SECRET`: A secure hashing secret.

2. **Backend Installation**
```bash
cd backend
npm install
npm run dev
```
*The backend API will run on `http://localhost:5000`*

3. **Frontend Installation**
```bash
cd frontend
npm install
npm run dev
```
*The React frontend will be accessible via `http://localhost:5173`*

---

## 3. User Manual & Workflow Demonstration

**1. User Registration/Login:** Navigate to `http://localhost:5173`. Click **Register** to create a new Organization and Admin User.
**2. Management Tools:** From the Sidebar, Admin users can navigate to **Team Members** to provision `Editor` or `Viewer` access for colleagues.
**3. Video Upload:** Editors and Admins can use the dashboard upload interface to upload `.mp4` video files up to 500MB.
**4. Processing Phase:** WebSockets broadcast live sensitivity analysis progress to the UI.
**5. Content Review:** Videos are flagged (10% chance) or marked Safe (90% chance). Flagged videos are blocked from viewing.
**6. Video Streaming:** Click the native Play icon on Safe videos. The player seamlessly loads media using byte-range requests.
**7. Advanced Filtering:** Sort videos by Date and filter by Status directly from the dashboard UI.

---

## 4. API Documentation

### Authentication Routes
- `POST /api/auth/register`: Registers a new tenant and Admin user. Body: `{ tenantName, name, email, password }`
- `POST /api/auth/login`: Authenticates an existing user. Body: `{ email, password }`
- `POST /api/auth/add-user`: (Admin Only) Adds a user to the tenant. Body: `{ name, email, password, role }`

### Video Routes
- `POST /api/videos/upload`: (Admin/Editor) Uploads a `.mp4` video (Multipart Form-Data). Initiates background processing.
- `GET /api/videos`: Retrieves tenant-scoped video library metadata.
- `GET /api/videos/stream/:id`: (Protected) HTTP 206 Partial Content video streaming endpoint. Supports `Range` constraints.

---

## 5. Architecture Overview

### Database Engine (MongoDB)
The schema architecture strictly enforces **Multi-Tenancy**. Every user and video document stores a `tenantId`. All queries are implicitly scoped to the `req.user.tenantId`, meaning cross-organization data leakage at the query level is impossible.

### Real-Time Pipeline (Socket.io)
When a video is uploaded, Node.js delegates processing to an asynchronous Event Emitter process logic (`videoProcessor.js`). This background worker actively pushes socket messages to `video-status-{tenantId}` rooms to ensure isolated progression updates on the dashboard.

### Streaming Pipeline
Videos are statically stored leveraging `fs.createReadStream`. The backend listens and processes `Range` HTTP headers to serve `206 Partial Content`. Because Cross-Origin checks often destroy streamed media headers, the server exposes explicitly allowed headers (`Accept-Ranges: bytes`) whilst unbinding `helmet()` rules for media protocols.

---

## 6. Assumptions and Design Decisions

- **Simulated AI Processing:** Rather than incurring thousands of dollars integrating AWS Rekognition or GCP Video Intelligence for the assignment, I implemented an AI Simulation loop in the backend. It mimics the time delay, socket broadcast, and random safe/flag output of a real AI parser.
- **Why Vanilla CSS?** The assignment suggested Tailwind, but for a true premium, custom Glassmorphism style with fine-granularity control over gradients and micro-animations, Vanilla CSS via CSS Variables (`index.css`) was selected as the design architecture framework. 
- **Role-Based Access Control:** I assumed the minimal viable RBAC requires: Viewer (Watch), Editor (Watch + Upload), and Admin (Watch + Upload + Invite Team).
- **Single-Node Execution:** The current application assumes it is running on a single Node instance since uploads are saved to the local file system `backend/uploads/`. If scaled horizontally to multiple servers, the local storage must be migrated to an AWS S3 bucket.
