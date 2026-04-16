import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import Modal from '../components/Modal';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [org, setOrg] = useState('');
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register({ name, email, password, organizationName: org });
      navigate('/');
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Registration Failed',
        message: error.response?.data?.message || 'Could not create account. Please try again.'
      });
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ width: '400px', maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Video color="var(--primary)" size={48} />
          <h2 style={{ marginTop: '1rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)' }}>Setup your organization</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Name</label>
            <input type="text" className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Organization Name</label>
            <input type="text" className="input-field" value={org} onChange={(e) => setOrg(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Register
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
      <Modal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
};

export default Register;
