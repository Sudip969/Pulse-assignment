import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import VideoUploader from '../components/VideoUploader';
import Modal from '../components/Modal';
import { PlayCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortDate, setSortDate] = useState('Newest');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });
  const navigate = useNavigate();

  const fetchVideos = async () => {
    try {
      const res = await api.get('/videos');
      setVideos(res.data);
    } catch (error) {
      console.error('Error fetching videos', error);
    }
  };

  const handleDelete = (id) => {
    setModal({
      isOpen: true,
      title: 'Delete Video',
      message: 'Are you sure you want to permanently delete this video? This action cannot be undone.',
      type: 'confirm',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await api.delete(`/videos/${id}`);
          fetchVideos();
        } catch (error) {
          setModal({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.message || 'Failed to delete video',
            type: 'alert'
          });
        }
      }
    });
  };

  useEffect(() => {
    fetchVideos();
    
    // Setup Socket
    const socket = io('http://localhost:5000');
    
    if (user?.tenantId) {
      socket.on(`video-status-${user.tenantId}`, (data) => {
        setProgressData((prev) => ({ ...prev, [data.videoId]: data }));
        
        // Update video in list if status changes to terminal states
        if (data.status === 'Safe' || data.status === 'Flagged' || data.status === 'Failed') {
          setVideos((prevVideos) => prevVideos.map((v) => 
            v._id === data.videoId ? { ...v, status: data.status } : v
          ));
        }
      });
    }

    return () => socket.disconnect();
  }, [user]);

  const canUpload = user?.role === 'Admin' || user?.role === 'Editor';

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="top-nav">
          <div>
            <h1>Library</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage and view your organization's video content.</p>
          </div>
        </div>

        {canUpload && <VideoUploader onUploadSuccess={fetchVideos} />}

        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ fontWeight: 600 }}>Advanced Filters</div>
          <div style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Status:</span>
            <select className="input-field" style={{ padding: '0.5rem', width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Safe">Safe</option>
              <option value="Flagged">Flagged</option>
              <option value="Processing">Processing</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sort by:</span>
            <select className="input-field" style={{ padding: '0.5rem', width: 'auto' }} value={sortDate} onChange={e => setSortDate(e.target.value)}>
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="video-grid">
          {videos
            .filter(vid => {
              if (filterStatus === 'All') return true;
              const displayStatus = progressData[vid._id]?.status || vid.status;
              return displayStatus === filterStatus;
            })
            .sort((a, b) => {
              const dA = new Date(a.createdAt).getTime();
              const dB = new Date(b.createdAt).getTime();
              return sortDate === 'Newest' ? dB - dA : dA - dB;
            })
            .map((vid) => {
            const currentProgress = progressData[vid._id];
            const displayStatus = currentProgress?.status || vid.status;
            const progressValue = currentProgress?.progress || 0;

            return (
              <div key={vid._id} className="video-card">
                <div className="video-thumb">
                  {displayStatus === 'Safe' ? (
                    <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/video/${vid._id}`)}>
                      <PlayCircle size={48} color="white" />
                    </div>
                  ) : displayStatus === 'Processing' ? (
                    <div style={{ width: '80%', textAlign: 'center' }}>
                      <div className="progress-bg">
                        <div className="progress-fill" style={{ width: `${progressValue}%` }}></div>
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Processing {progressValue}%
                      </div>
                    </div>
                  ) : displayStatus === 'Flagged' ? (
                    <div style={{ color: 'var(--status-flagged)', fontWeight: 600 }}>FLAGGED CONTENT</div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{displayStatus}</div>
                  )}
                </div>
                <div className="video-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {vid.title}
                    </h4>
                    <span className={`status-tag tag-${displayStatus.toLowerCase()}`}>
                      {displayStatus}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Uploaded by {vid.uploaderId?.name}
                  </p>
                  {canUpload && (
                    <button 
                      onClick={() => handleDelete(vid._id)} 
                      className="btn-icon" 
                      title="Delete Video"
                      style={{ marginTop: '0.5rem', color: 'var(--status-flagged)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
            })}
        </div>
      </div>

      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        onConfirm={modal.onConfirm}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
};

export default Dashboard;
