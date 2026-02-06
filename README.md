# 🎬 Watch Party

A real-time watch party application that lets you watch videos together with friends. The host uploads a video, and everyone watches in perfect sync!

## Features

- **Video Upload**: Host uploads any video file (MP4, WebM, OGG, MOV, AVI)
- **Real-time Sync**: Play, pause, and seek synchronized across all viewers
- **Live Chat**: Chat with other participants in real-time
- **Reactions**: Send emoji reactions that float across the screen
- **Participant List**: See who's watching with you
- **Room Controls**: Host has full control over video playback
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, React Router, Socket.IO Client, Axios
- **Backend**: Node.js, Express, Socket.IO, Multer
- **Styling**: Custom CSS with CSS Variables

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

## Quick Start

### 1. Install Dependencies

```bash
cd watch-party

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Start the Development Servers

From the `watch-party` directory:

```bash
# Start both servers concurrently
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Start the backend server (port 5000)
cd server && npm run dev

# Terminal 2 - Start the React frontend (port 3000)
cd client && npm start
```

### 3. Open the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

### Creating a Watch Party

1. Enter your nickname on the home page
2. Click "Create Room"
3. Upload a video file (up to 500MB)
4. Share the room code or link with friends

### Joining a Watch Party

1. Get the room code or link from the host
2. Enter your nickname
3. Click "Join Room"
4. Enjoy watching together!

### Host Controls

- **Play/Pause**: Click the video or use the play button
- **Seek**: Drag the progress bar to any position
- **Change Video**: Upload a new video anytime

### Viewer Experience

- Video playback is automatically synced with the host
- Use "Re-sync" button if you get out of sync
- Chat and react with other viewers

## Project Structure

```
watch-party/
├── package.json          # Root package with workspace config
├── server/
│   ├── package.json
│   └── src/
│       └── index.js      # Express + Socket.IO server
└── client/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── App.js
        ├── pages/
        │   ├── Home.js       # Landing page
        │   ├── JoinRoom.js   # Room join page
        │   └── Room.js       # Main watch party room
        ├── components/
        │   ├── VideoPlayer.js
        │   ├── Chat.js
        │   ├── Participants.js
        │   ├── Reactions.js
        │   └── VideoUpload.js
        └── styles/
            └── index.css
```

## API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms` | Create a new room |
| GET | `/api/rooms/:roomId` | Get room information |
| POST | `/api/rooms/:roomId/video` | Upload video to room |
| GET | `/api/video/:videoId` | Stream video file |

### WebSocket Events

**Client → Server:**
- `join-room` - Join a room
- `video-play` - Host plays video
- `video-pause` - Host pauses video
- `video-seek` - Host seeks video
- `request-sync` - Request sync from host
- `chat-message` - Send chat message
- `reaction` - Send reaction

**Server → Client:**
- `room-joined` - Room join confirmation
- `video-uploaded` - New video uploaded
- `video-sync` - Sync playback state
- `participant-joined` - New participant
- `participant-left` - Participant left
- `new-message` - New chat message
- `new-reaction` - New reaction

## Configuration

### Environment Variables

**Server:**
- `PORT` - Server port (default: 5000)
- `CLIENT_URL` - Client URL for CORS (default: http://localhost:3000)

**Client:**
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000)
- `REACT_APP_SOCKET_URL` - WebSocket URL (default: http://localhost:5000)

## Limitations

- Videos are stored in memory (temporary storage)
- Maximum video size: 500MB
- Rooms expire after 24 hours of inactivity
- Best performance with < 50 participants per room

## License

MIT
