import React from 'react';

const REACTION_EMOJIS = ['😂', '❤️', '🔥', '👏', '😮', '😢', '🎉', '👍'];

function Reactions({ reactions, onReact }) {
  return (
    <div className="reactions-container">
      {/* Floating reactions */}
      <div className="floating-reactions">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="floating-reaction"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              animationDelay: `${Math.random() * 0.5}s`
            }}
          >
            <span className="reaction-emoji">{reaction.emoji}</span>
            <span className="reaction-sender">{reaction.senderName}</span>
          </div>
        ))}
      </div>

      {/* Reaction buttons */}
      <div className="reaction-buttons">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className="reaction-btn"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Reactions;
