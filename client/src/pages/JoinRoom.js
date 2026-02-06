import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

function JoinRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/rooms/${roomId}`);
        setRoomInfo(response.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Room not found. It may have expired or been deleted.');
        } else {
          setError('Failed to load room information');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoomInfo();
  }, [roomId]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please enter your nickname');
      return;
    }

    setIsJoining(true);
    sessionStorage.setItem('nickname', nickname.trim());
    navigate(`/room/${roomId}`);
  };

  if (loading) {
    return (
      <div className="join-container">
        <div className="loading">Loading room info...</div>
      </div>
    );
  }

  if (error && !roomInfo) {
    return (
      <div className="join-container">
        <div className="join-card error-card">
          <h2>Oops!</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="join-container">
      <div className="join-card">
        <div className="room-preview">
          <div className="room-code-large">{roomInfo.roomId}</div>
          <div className="room-meta">
            <span>Hosted by {roomInfo.hostName}</span>
            <span>{roomInfo.participantCount} watching</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label htmlFor="nickname">Your Name</label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
            />
          </div>
          <button type="submit" disabled={isJoining} className="btn btn-primary btn-full">
            {isJoining ? 'Joining...' : 'Join'}
          </button>
        </form>

        <button onClick={() => navigate('/')} className="btn btn-link">
          Back
        </button>
      </div>
    </div>
  );
}

export default JoinRoom;
