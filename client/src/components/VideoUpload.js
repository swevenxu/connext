import React, { useState, useRef } from 'react';

function VideoUpload({ onUpload, compact = false, externalProgress = 0, externalUploading = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  // Use external progress if provided, otherwise use internal state
  const isUploading = externalUploading;
  const uploadProgress = externalProgress;

  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', ''];
  const maxSize = 10 * 1024 * 1024 * 1024; // 10GB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload MP4, WebM, OGG, MOV, AVI, or MKV files.');
      return false;
    }
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10GB.');
      return false;
    }
    return true;
  };

  const handleFile = async (file) => {
    setError('');
    
    if (!validateFile(file)) {
      return;
    }

    try {
      await onUpload(file);
    } catch (err) {
      setError('Upload failed. Please try again.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (compact) {
    return (
      <div className="video-upload-compact">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="video/*"
          style={{ display: 'none' }}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-small"
          disabled={isUploading}
        >
          {isUploading ? `Uploading ${uploadProgress}%` : 'Change Video'}
        </button>
        {error && <span className="upload-error-small">{error}</span>}
      </div>
    );
  }

  return (
    <div className="video-upload-container">
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="video/*"
          style={{ display: 'none' }}
        />

        {isUploading ? (
          <div className="upload-progress">
            <div className="progress-circle">
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="8"
                  strokeDasharray={`${uploadProgress * 2.83} 283`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
            <p>Uploading video...</p>
          </div>
        ) : (
          <>
            <h3>Upload a Video</h3>
            <p>Drag and drop a video file here, or click to browse</p>
            <div className="upload-info">
              <span>Supported: MP4, WebM, OGG, MOV, AVI, MKV</span>
              <span>Max size: 10GB</span>
            </div>
          </>
        )}
      </div>

      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}

export default VideoUpload;
