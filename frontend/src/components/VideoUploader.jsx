import { useState, useRef } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { UploadCloud, CheckCircle } from 'lucide-react';

const VideoUploader = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title || file.name);

    try {
      await api.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFile(null);
      setTitle('');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Upload Failed',
        message: 'There was an error while uploading the video. Please check your connection and try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Upload Video</h3>
      {file ? (
        <div>
          <div className="input-group">
            <label className="input-label">Video Title</label>
            <input 
              type="text" 
              className="input-field" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder={file.name}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Publish Video'}
            </button>
            <button className="btn btn-outline" onClick={() => setFile(null)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div 
          className="upload-area" 
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h4>Click or drag video to this area to upload</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="video/*" 
            style={{ display: 'none' }} 
          />
        </div>
      )}
      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
};

export default VideoUploader;
