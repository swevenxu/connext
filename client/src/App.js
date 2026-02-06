import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import JoinRoom from './pages/JoinRoom';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join/:roomId" element={<JoinRoom />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </div>
  );
}

export default App;
