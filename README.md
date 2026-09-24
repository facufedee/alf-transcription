# ALF: Real-Time Conference Transcription Platform

Alien Live Feed – Real-time transcription for live conferences. Simultaneous sessions, instant subtitles (original language + Spanish). Open source, zero cost, built for accessibility at scale.

## What is ALF?

ALF solves the accessibility problem for large conferences with multiple simultaneous sessions. Instead of expensive commercial tools (Zoom Premium, custom transcription services) or manual subtitle operations, ALF provides free, open-source real-time transcription at scale.

**Built for Nerdearla 2026** – a conference with 30+ simultaneous English sessions, ALF captures audio from multiple stages, transcribes instantly using Google's Gemini API, and broadcasts subtitles in both the original language and Spanish.

## Features

- 🎙️ **Live Audio Capture** – Stream audio from multiple conference stages simultaneously
- 📝 **Real-Time Transcription** – Instant speech-to-text using Google Gemini API
- 🌍 **Automatic Translation** – English ↔ Spanish translation on-the-fly
- 📺 **Live Subtitle Broadcasting** – WebSocket-powered real-time updates to attendees
- 🔧 **Fully Open Source** – MIT licensed, ready to deploy at any conference
- 🐳 **Docker Ready** – One-command deployment with Docker Compose

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Next.js + React + TailwindCSS
- **Real-Time:** WebSocket (Socket.io)
- **AI:** Google Gemini API
- **Deployment:** Docker + Docker Compose
- **Language:** TypeScript

## Project Structure

```
alf-transcription/
├── backend/                 # Express server
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── services/       # Gemini, audio processing
│   │   ├── routes/         # API routes
│   │   └── types/          # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── frontend/               # Next.js app
│   ├── pages/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .gitignore
├── LICENSE                 # MIT
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (optional)
- Google Gemini API key

### Local Development

```bash
# Clone & setup
git clone https://github.com/facufedee/alf-transcription.git
cd alf-transcription

# Backend
cd backend
npm install
cp .env.example .env
# Add your GOOGLE_GEMINI_API_KEY to .env
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### With Docker

```bash
docker-compose up --build
```

Open http://localhost:3000

## How It Works

1. **Audio Input:** Live audio streams from conference stages feed into the backend
2. **Transcription:** Google Gemini API processes audio chunks in real-time
3. **Translation:** Simultaneous transcription in original language + Spanish
4. **Broadcasting:** WebSocket emits subtitles to all connected clients
5. **Display:** Attendees select their session and preferred language on the frontend

## Configuration

Create `.env` in `backend/`:

```
GOOGLE_GEMINI_API_KEY=your_api_key_here
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:3000
```

## Deployment

ALF is built for quick deployment at conferences:

```bash
# Using Docker
docker-compose -f docker-compose.prod.yml up -d

# Environment variables
GOOGLE_GEMINI_API_KEY=xxx
BACKEND_URL=https://your-domain.com/api
```

## Roadmap

- [x] Multi-session transcription
- [x] Real-time WebSocket broadcasting
- [ ] Speaker identification
- [ ] Searchable transcript archive
- [ ] Custom conference branding
- [ ] Support for 5+ language pairs
- [ ] Mobile app (React Native)

## License

MIT License – See LICENSE file

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Support

Questions? Check the [Discord #nerdearla-vibeathon](https://discord.gg/nerdearla) or open an issue.

---

**Built with ❤️ for Nerdearla 2026**
