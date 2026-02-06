const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 5e9 // 5GB max for video uploads
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production' || fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// In-memory storage for rooms and videos
const rooms = new Map();
const videos = new Map();

// Configure multer for video upload (store on disk for large files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const videoId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${videoId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed (MP4, WebM, OGG, MOV, AVI, MKV).'));
    }
  }
});

// Room class to manage room state
class Room {
  constructor(id, hostId, hostName) {
    this.id = id;
    this.hostId = hostId; // Original UUID for API auth
    this.hostSocketId = null; // Socket ID for real-time control
    this.hostName = hostName;
    this.participants = new Map();
    this.videoId = null;
    this.videoState = {
      isPlaying: false,
      currentTime: 0,
      lastUpdated: Date.now()
    };
    this.chat = [];
    this.reactions = [];
    this.createdAt = Date.now();
  }

  addParticipant(socketId, nickname, isHost = false) {
    if (isHost) {
      this.hostSocketId = socketId;
    }
    this.participants.set(socketId, {
      id: socketId,
      nickname,
      isHost: isHost,
      joinedAt: Date.now()
    });
  }

  removeParticipant(socketId) {
    this.participants.delete(socketId);
  }

  getParticipantList() {
    return Array.from(this.participants.values());
  }

  addMessage(socketId, message) {
    const participant = this.participants.get(socketId);
    if (participant) {
      const chatMessage = {
        id: uuidv4(),
        senderId: socketId,
        senderName: participant.nickname,
        message,
        timestamp: Date.now()
      };
      this.chat.push(chatMessage);
      // Keep only last 100 messages
      if (this.chat.length > 100) {
        this.chat = this.chat.slice(-100);
      }
      return chatMessage;
    }
    return null;
  }

  addReaction(socketId, emoji) {
    const participant = this.participants.get(socketId);
    if (participant) {
      const reaction = {
        id: uuidv4(),
        senderId: socketId,
        senderName: participant.nickname,
        emoji,
        timestamp: Date.now()
      };
      this.reactions.push(reaction);
      // Keep only last 50 reactions
      if (this.reactions.length > 50) {
        this.reactions = this.reactions.slice(-50);
      }
      return reaction;
    }
    return null;
  }

  updateVideoState(isPlaying, currentTime) {
    this.videoState = {
      isPlaying,
      currentTime,
      lastUpdated: Date.now()
    };
  }

  getCurrentVideoTime() {
    if (this.videoState.isPlaying) {
      const elapsed = (Date.now() - this.videoState.lastUpdated) / 1000;
      return this.videoState.currentTime + elapsed;
    }
    return this.videoState.currentTime;
  }
}

// REST API Routes

// Create a new room
app.post('/api/rooms', (req, res) => {
  const { hostName } = req.body;
  if (!hostName) {
    return res.status(400).json({ error: 'Host name is required' });
  }

  const roomId = uuidv4().substring(0, 8).toUpperCase();
  const hostId = uuidv4();
  const room = new Room(roomId, hostId, hostName);
  rooms.set(roomId, room);

  res.json({
    roomId,
    hostId,
    message: 'Room created successfully'
  });
});

// Get room info
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId.toUpperCase());

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    roomId: room.id,
    hostName: room.hostName,
    participantCount: room.participants.size,
    hasVideo: !!room.videoId,
    createdAt: room.createdAt
  });
});

// Upload video to room
app.post('/api/rooms/:roomId/video', upload.single('video'), (req, res) => {
  const { roomId } = req.params;
  const { hostId } = req.body;
  const room = rooms.get(roomId.toUpperCase());

  if (!room) {
    // Clean up uploaded file if room not found
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.hostId !== hostId) {
    // Clean up uploaded file if not host
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(403).json({ error: 'Only the host can upload videos' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  // Remove old video file if exists
  if (room.videoId && videos.has(room.videoId)) {
    const oldVideo = videos.get(room.videoId);
    if (oldVideo.filepath && fs.existsSync(oldVideo.filepath)) {
      fs.unlinkSync(oldVideo.filepath);
    }
    videos.delete(room.videoId);
  }

  // Extract videoId from filename (we set it in multer)
  const videoId = path.basename(req.file.filename, path.extname(req.file.filename));
  
  videos.set(videoId, {
    filepath: req.file.path,
    mimetype: req.file.mimetype,
    originalname: req.file.originalname,
    size: req.file.size
  });

  room.videoId = videoId;
  room.videoState = {
    isPlaying: false,
    currentTime: 0,
    lastUpdated: Date.now()
  };

  console.log(`Video uploaded: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

  // Notify all participants about the new video
  io.to(roomId.toUpperCase()).emit('video-uploaded', {
    videoId,
    filename: req.file.originalname,
    size: req.file.size
  });

  res.json({
    videoId,
    filename: req.file.originalname,
    size: req.file.size,
    message: 'Video uploaded successfully'
  });
});

// Stream video
app.get('/api/video/:videoId', (req, res) => {
  const { videoId } = req.params;
  const video = videos.get(videoId);

  if (!video || !video.filepath || !fs.existsSync(video.filepath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const stat = fs.statSync(video.filepath);
  const videoSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': video.mimetype
    });

    const stream = fs.createReadStream(video.filepath, { start, end });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': videoSize,
      'Content-Type': video.mimetype
    });
    fs.createReadStream(video.filepath).pipe(res);
  }
});

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room
  socket.on('join-room', ({ roomId, nickname, hostId }) => {
    const room = rooms.get(roomId.toUpperCase());

    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Check if this is the host (by matching the original hostId UUID)
    const isHost = hostId && hostId === room.hostId;

    socket.join(roomId.toUpperCase());
    room.addParticipant(socket.id, nickname, isHost);

    // Send room state to the new participant
    socket.emit('room-joined', {
      roomId: room.id,
      isHost: isHost,
      videoId: room.videoId,
      videoState: {
        ...room.videoState,
        currentTime: room.getCurrentVideoTime()
      },
      participants: room.getParticipantList(),
      chat: room.chat.slice(-50) // Send last 50 messages
    });

    // Notify others about the new participant
    socket.to(roomId.toUpperCase()).emit('participant-joined', {
      participant: room.participants.get(socket.id),
      participants: room.getParticipantList()
    });

    socket.roomId = roomId.toUpperCase();
    socket.nickname = nickname;
  });

  // Video control events (host only)
  socket.on('video-play', ({ roomId, currentTime }) => {
    const room = rooms.get(roomId);
    if (room && socket.id === room.hostSocketId) {
      room.updateVideoState(true, currentTime);
      socket.to(roomId).emit('video-sync', {
        action: 'play',
        currentTime,
        timestamp: Date.now()
      });
    }
  });

  socket.on('video-pause', ({ roomId, currentTime }) => {
    const room = rooms.get(roomId);
    if (room && socket.id === room.hostSocketId) {
      room.updateVideoState(false, currentTime);
      socket.to(roomId).emit('video-sync', {
        action: 'pause',
        currentTime,
        timestamp: Date.now()
      });
    }
  });

  socket.on('video-seek', ({ roomId, currentTime }) => {
    const room = rooms.get(roomId);
    if (room && socket.id === room.hostSocketId) {
      room.updateVideoState(room.videoState.isPlaying, currentTime);
      socket.to(roomId).emit('video-sync', {
        action: 'seek',
        currentTime,
        timestamp: Date.now()
      });
    }
  });

  // Request sync (for late joiners or out-of-sync viewers)
  socket.on('request-sync', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.emit('video-sync', {
        action: room.videoState.isPlaying ? 'play' : 'pause',
        currentTime: room.getCurrentVideoTime(),
        timestamp: Date.now()
      });
    }
  });

  // Chat message
  socket.on('chat-message', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    if (room) {
      const chatMessage = room.addMessage(socket.id, message);
      if (chatMessage) {
        io.to(roomId).emit('new-message', chatMessage);
      }
    }
  });

  // Reaction
  socket.on('reaction', ({ roomId, emoji }) => {
    const room = rooms.get(roomId);
    if (room) {
      const reaction = room.addReaction(socket.id, emoji);
      if (reaction) {
        io.to(roomId).emit('new-reaction', reaction);
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        const wasHost = socket.id === room.hostSocketId;
        room.removeParticipant(socket.id);
        
        // Clear host socket if host disconnected
        if (wasHost) {
          room.hostSocketId = null;
        }

        // Notify others
        io.to(socket.roomId).emit('participant-left', {
          participantId: socket.id,
          nickname: socket.nickname,
          wasHost,
          participants: room.getParticipantList()
        });

        // Clean up empty rooms
        if (room.participants.size === 0) {
          if (room.videoId && videos.has(room.videoId)) {
            const video = videos.get(room.videoId);
            if (video.filepath && fs.existsSync(video.filepath)) {
              fs.unlinkSync(video.filepath);
              console.log(`Deleted video file: ${video.filepath}`);
            }
            videos.delete(room.videoId);
          }
          rooms.delete(socket.roomId);
          console.log(`Room ${socket.roomId} deleted (empty)`);
        }
      }
    }
  });
});

// Cleanup old rooms periodically (every hour)
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [roomId, room] of rooms) {
    if (now - room.createdAt > maxAge && room.participants.size === 0) {
      if (room.videoId && videos.has(room.videoId)) {
        const video = videos.get(room.videoId);
        if (video.filepath && fs.existsSync(video.filepath)) {
          fs.unlinkSync(video.filepath);
          console.log(`Deleted video file: ${video.filepath}`);
        }
        videos.delete(room.videoId);
      }
      rooms.delete(roomId);
      console.log(`Room ${roomId} cleaned up (expired)`);
    }
  }
}, 60 * 60 * 1000);

// Catch-all route for React Router (must be after API routes)
if (process.env.NODE_ENV === 'production' || fs.existsSync(publicDir)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
