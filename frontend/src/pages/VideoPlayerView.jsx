import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ArrowLeft } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const VideoPlayerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const token = localStorage.getItem('token');
  // Since video streaming is via standard <video> tag, the browser handles standard HTTP requests without Authorization header from fetch. 
  // Wait, standard HTML5 <video> src attribute cannot natively send an Authorization bearer token.
  // One way around this for protected stream endpoints is to pass the token in query params.
  // We need to update backend to accept token from query params or cookies for the stream endpoint.
  // For the sake of this prompt, we'll pass it in the URL.
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const videoSrc = `${API_URL}/api/videos/stream/${id}?token=${token}`;

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <button 
          className="btn btn-outline" 
          onClick={() => navigate('/')}
          style={{ marginBottom: '2rem' }}
        >
          <ArrowLeft size={16} /> Back to Library
        </button>

        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <video 
            controls 
            autoPlay 
            style={{ width: '100%', display: 'block', maxHeight: '70vh', background: '#000' }}
          >
            <source src={videoSrc} />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerView;
