import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const isDev = window.location.port === '3000';
const API_URL = process.env.REACT_APP_API_URL || (isDev ? 'http://localhost:5001' : '');

function Home() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const createRoom = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please enter your nickname');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/rooms`, {
        hostName: nickname.trim()
      });

      const { roomId, hostId } = response.data;
      
      // Store host credentials in sessionStorage
      sessionStorage.setItem('hostId', hostId);
      sessionStorage.setItem('nickname', nickname.trim());
      
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please enter your nickname');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      // Check if room exists
      await axios.get(`${API_URL}/api/rooms/${roomCode.trim().toUpperCase()}`);
      
      sessionStorage.setItem('nickname', nickname.trim());
      navigate(`/room/${roomCode.trim().toUpperCase()}`);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Room not found. Please check the room code.');
      } else {
        setError(err.response?.data?.error || 'Failed to join room');
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="home-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="home-cards">
        <div className="card">
          <div className="form-group">
            <label htmlFor="create-nickname">YOUR NAME</label>
            <input
              id="create-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>
          <button 
            onClick={createRoom} 
            disabled={isCreating}
            className="btn btn-primary"
          >
            {isCreating ? 'CREATING...' : 'CREATE ROOM'}
          </button>
        </div>

        <div className="card">
          <div className="form-group">
            <label htmlFor="room-code">ROOM CODE</label>
            <input
              id="room-code"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
          </div>
          <div className="form-group">
            <label htmlFor="join-nickname">YOUR NAME</label>
            <input
              id="join-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>
          <button 
            onClick={joinRoom} 
            disabled={isJoining}
            className="btn btn-primary"
          >
            {isJoining ? 'JOINING...' : 'JOIN ROOM'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
