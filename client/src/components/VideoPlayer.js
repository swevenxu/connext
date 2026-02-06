import React, { forwardRef, useState, useEffect } from 'react';

// SVG Icons
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

const VolumeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
  </svg>
);

const MutedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
  </svg>
);

const FullscreenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
  </svg>
);

const ExitFullscreenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
  </svg>
);

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
        // If guest, request sync first then play
        if (!isHost && onRequestSync) {
          onRequestSync();
        }
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
        playsInline
        webkit-playsinline="true"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeked={handleSeeked}
        onClick={togglePlay}
      />

      {/* Center play button overlay */}
      {!isPlaying && (
        <div className="play-overlay" onClick={togglePlay}>
          <div className="play-overlay-btn">
            <PlayIcon />
          </div>
        </div>
      )}

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
            {isHost && (
              <button onClick={togglePlay} className="control-btn">
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
            )}

            <div className="volume-control">
              <button onClick={toggleMute} className="control-btn">
                {isMuted || volume === 0 ? <MutedIcon /> : <VolumeIcon />}
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
            <button onClick={toggleFullscreen} className="control-btn">
              {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
