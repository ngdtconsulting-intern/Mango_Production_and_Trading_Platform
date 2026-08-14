import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { FiMapPin, FiPaperclip, FiCamera } from 'react-icons/fi';
import api from '../../services/api';
import '../../styles/community.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function ChatBox() {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    connectSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/chat/history', { params: { limit: 50 } });
      setMessages(data.messages);
    } catch (error) {
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    const token = localStorage.getItem('token');
    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('connect_error', (err) => {
      toast.error('Chat connection failed: ' + err.message);
    });

    socket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current = socket;
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;

    let imageUrl;

    if (imageFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', imageFile);
        const { data } = await api.post('/chat/upload', formData);
        imageUrl = data.imageUrl;
      } catch (error) {
        toast.error('Failed to upload image');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    socketRef.current?.emit('send_message', { message: text.trim(), imageUrl }, (ack) => {
      if (!ack?.success) {
        toast.error(ack?.message || 'Failed to send message');
      }
    });

    setText('');
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Farmer Community</h1>
        <span className={`connection-badge ${connected ? 'online' : 'offline'}`}>
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>
      <p className="community-subtitle">Chat with other farmers: ask questions, share updates, get help.</p>

      <div className="chat-window">
        {loading ? (
          <p className="chat-loading">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="chat-loading">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`chat-message ${msg.senderId === user?._id ? 'own' : ''}`}
            >
              <div className="chat-message-meta">
                <strong>{msg.senderName}</strong>
                <span className="chat-role-tag">{msg.senderRole}</span>
                {(msg.district || msg.area) && (
                  <span className="chat-location-tag">
                    <FiMapPin size={11} /> {msg.area ? `${msg.area}, ` : ''}{msg.district}
                  </span>
                )}
              </div>
              {msg.message && <p className="chat-message-text">{msg.message}</p>}
              {msg.imageUrl && (
                <img src={msg.imageUrl} alt="Shared" className="chat-message-image" />
              )}
              <span className="chat-message-time">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-composer" onSubmit={handleSend}>
        {imageFile && (
          <div className="chat-attachment-preview">
            <FiPaperclip size={14} /> {imageFile.name}
            <button type="button" onClick={() => { setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
              ×
            </button>
          </div>
        )}
        <div className="chat-composer-row">
          <label className="chat-attach-btn">
            <FiCamera />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </label>
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
          />
          <button type="submit" className="btn-primary" disabled={uploading || (!text.trim() && !imageFile)}>
            {uploading ? 'Uploading...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}