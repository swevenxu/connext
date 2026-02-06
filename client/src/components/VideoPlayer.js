import React, { forwardRef, useState, useEffect } from 'react';

const VideoPlayer = forwardRef(({ videoUrl, isHost, onPlay, onPause, onSeek, onRequestSync }, ref) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let timeout;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleTimeUpdate = () => {
    if (ref.current) {
      setCurrentTime(ref.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (ref.current) {
      setDuration(ref.current.duration);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (isHost) onPlay();
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (isHost) onPause();
  };

  const handleSeeked = () => {
    if (isHost) onSeek();
  };

  const togglePlay = () => {
    if (ref.current) {
      if (ref.current.paused) {
        ref.current.play();
      } else {
        ref.current.pause();
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (ref.current) {
      ref.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (ref.current) {
      ref.current.muted = !ref.current.muted;
      setIsMuted(ref.current.muted);
    }
  };

  const handleSeekBar = (e) => {
    if (ref.current && isHost) {
      const time = parseFloat(e.target.value);
      ref.current.currentTime = time;
    }
  };

  const toggleFullscreen = () => {
    const container = ref.current?.parentElement;
    if (!document.fullscreenElement) {
      container?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="video-player-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={ref}
        src={videoUrl}
        className="video-player"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeked={handleSeeked}
        onClick={isHost ? togglePlay : undefined}
      />

      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
        <div className="progress-bar-container">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeekBar}
            className="progress-bar"
            disabled={!isHost}
          />
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          />
        </div>

        <div className="controls-row">
          <div className="controls-left">
            {isHost ? (
              <button onClick={togglePlay} className="control-btn play-btn">
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            ) : (
              <span className="sync-indicator">Synced</span>
            )}

            <div className="volume-control">
              <button onClick={toggleMute} className="control-btn">
                {isMuted || volume === 0 ? 'Muted' : 'Vol'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>

            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            {!isHost && (
              <button onClick={onRequestSync} className="control-btn" title="Re-sync with host">
                Sync
              </button>
            )}
            <button onClick={toggleFullscreen} className="control-btn">
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </button>
          </div>
        </div>
      </div>

      {!isHost && (
        <div className="host-control-notice">
          Only the host can control playback
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
