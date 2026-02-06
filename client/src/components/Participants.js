import React from 'react';

function Participants({ participants, currentUserId }) {
  const sortedParticipants = [...participants].sort((a, b) => {
    // Host first, then by join time
    if (a.isHost) return -1;
    if (b.isHost) return 1;
    return a.joinedAt - b.joinedAt;
  });

  return (
    <div className="participants-container">
      <div className="participants-header">
        <h3>Participants</h3>
        <span className="participant-count">{participants.length}</span>
      </div>

      <div className="participants-list">
        {sortedParticipants.map((participant) => (
          <div
            key={participant.id}
            className={`participant ${participant.id === currentUserId ? 'is-you' : ''}`}
          >
            <div className="participant-avatar">
              {participant.nickname.charAt(0).toUpperCase()}
            </div>
            <div className="participant-info">
              <span className="participant-name">
                {participant.nickname}
                {participant.id === currentUserId && ' (You)'}
              </span>
              {participant.isHost && (
                <span className="host-badge">Host</span>
              )}
            </div>
            <div className="participant-status">
              <span className="online-indicator"></span>
            </div>
          </div>
        ))}
      </div>

      {participants.length === 1 && (
        <div className="invite-prompt">
          <p>Invite friends to join!</p>
          <small>Share the room code or link</small>
        </div>
      )}
    </div>
  );
}

export default Participants;
