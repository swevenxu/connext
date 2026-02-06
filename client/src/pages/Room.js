import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import VideoUpload from '../components/VideoUpload';

const API_URL = process.env.REACT_APP_API_URL || '';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || window.location.origin;

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const videoRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [videoId, setVideoId] = useState(null);
  const [videoState, setVideoState] = useState({ isPlaying: false, currentTime: 0 });
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(true);

  const nickname = sessionStorage.getItem('nickname');
  const hostId = sessionStorage.getItem('hostId');

  // Initialize socket connection
  useEffect(() => {
    if (!nickname) {
      navigate(`/join/${roomId}`);
      return;
    }

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server');
      socket.emit('join-room', { roomId, nickname, hostId });
    });

    socket.on('room-joined', (data) => {
      setIsConnected(true);
      setIsHost(data.isHost);
      setVideoId(data.videoId);
      setVideoState(data.videoState);
      setParticipants(data.participants);
      setMessages(data.chat);
    });

    socket.on('error', (data) => {
      setError(data.message);
    });

    socket.on('video-uploaded', (data) => {
      setVideoId(data.videoId);
      setVideoState({ isPlaying: false, currentTime: 0 });
    });

    socket.on('video-sync', (data) => {
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Calculate time offset for network latency
        const latency = (Date.now() - data.timestamp) / 1000;
        const adjustedTime = data.currentTime + (data.action === 'play' ? latency : 0);

        if (Math.abs(video.currentTime - adjustedTime) > 0.5) {
          video.currentTime = adjustedTime;
        }

        if (data.action === 'play') {
          video.play().catch(console.error);
        } else if (data.action === 'pause') {
          video.pause();
        } else if (data.action === 'seek') {
          video.currentTime = data.currentTime;
        }

        setVideoState({
          isPlaying: data.action === 'play',
          currentTime: adjustedTime
        });
      }
    });

    socket.on('participant-joined', (data) => {
      setParticipants(data.participants);
    });

    socket.on('participant-left', (data) => {
      setParticipants(data.participants);
    });

    socket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, nickname, hostId, navigate]);

  // Video control handlers (host only)
  const handlePlay = useCallback(() => {
    if (isHost && socketRef.current && videoRef.current) {
      socketRef.current.emit('video-play', {
        roomId,
        currentTime: videoRef.current.currentTime
      });
    }
  }, [isHost, roomId]);

  const handlePause = useCallback(() => {
    if (isHost && socketRef.current && videoRef.current) {
      socketRef.current.emit('video-pause', {
        roomId,
        currentTime: videoRef.current.currentTime
      });
    }
  }, [isHost, roomId]);

  const handleSeek = useCallback(() => {
    if (isHost && socketRef.current && videoRef.current) {
      socketRef.current.emit('video-seek', {
        roomId,
        currentTime: videoRef.current.currentTime
      });
    }
  }, [isHost, roomId]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleVideoUpload = async (file) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('hostId', hostId);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await axios.post(`${API_URL}/api/rooms/${roomId}/video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      setUploadProgress(100);
      // Set videoId directly from response to avoid race condition with socket
      if (response.data.videoId) {
        setVideoId(response.data.videoId);
        setVideoState({ isPlaying: false, currentTime: 0 });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = (message) => {
    if (socketRef.current) {
      socketRef.current.emit('chat-message', { roomId, message });
    }
  };

  const handleRequestSync = () => {
    if (socketRef.current) {
      socketRef.current.emit('request-sync', { roomId });
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(link);
    alert('Room link copied to clipboard!');
  };

  if (error && !isConnected) {
    return (
      <div className="room-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="room-container">
      <header className="room-header">
        <div className="room-info">
        </div>
        <div className="room-controls">
          <button onClick={copyRoomLink} className="btn btn-pill btn-icon" title="Copy invite link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.479 3.53087C19.552 2.60383 18.2979 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.46997L11.75 5.17997" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60706C11.7642 9.26329 11.0685 9.05886 10.3533 9.00765C9.63816 8.95643 8.92037 9.05966 8.24861 9.3102C7.57685 9.56074 6.96684 9.95296 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04519 15.666 2.05659 16.977C2.06798 18.288 2.59382 19.5421 3.52086 20.4691C4.4479 21.3961 5.70197 21.922 7.01295 21.9334C8.32393 21.9448 9.58694 21.4408 10.53 20.53L12.24 18.82" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => navigate('/')} className="btn btn-pill btn-danger">
            LEAVE
          </button>
        </div>
      </header>

      <div className="room-main">
        <div className={`video-section ${!showChat && !showParticipants ? 'full-width' : ''}`}>
          {videoId && !isUploading ? (
            <VideoPlayer
              ref={videoRef}
              videoUrl={`${API_URL}/api/video/${videoId}`}
              isHost={isHost}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onRequestSync={handleRequestSync}
            />
          ) : (
            <div className="no-video">
              {isHost ? (
                <VideoUpload 
                  onUpload={handleVideoUpload} 
                  externalProgress={uploadProgress}
                  externalUploading={isUploading}
                />
              ) : (
                <div className="waiting-for-video">
                  <h3>Waiting for host to upload a video...</h3>
                  <p>The host will upload a video shortly</p>
                </div>
              )}
            </div>
          )}

        </div>

        <div className={`sidebar ${!showChat ? 'hidden' : ''}`}>
          <Chat 
            messages={messages} 
            onSendMessage={handleSendMessage}
            currentUserId={socketRef.current?.id}
          />
        </div>
      </div>

      {!isConnected && (
        <div className="connection-overlay">
          <div className="connection-status">
            <span className="spinner"></span>
            <p>Connecting to room...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Room;
