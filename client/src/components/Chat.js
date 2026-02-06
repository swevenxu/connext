import React, { useState, useRef, useEffect } from 'react';

function Chat({ messages, onSendMessage, currentUserId }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat</h3>
        <span className="message-count">{messages.length} messages</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet</p>
            <span>Be the first to say something!</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.senderId === currentUserId ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="sender-name">{msg.senderName}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          maxLength={500}
          className="chat-input"
        />
        <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
