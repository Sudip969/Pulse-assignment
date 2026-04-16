import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { Users, UserPlus, Trash2, UserX, UserCheck } from 'lucide-react';

const TeamManagement = () => {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/add-user', { name, email, password, role });
      setName('');
      setEmail('');
      setPassword('');
      setRole('Viewer');
      fetchUsers();
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create user'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (user) => {
    setModal({
      isOpen: true,
      title: `${user.isActive ? 'Deactivate' : 'Activate'} User`,
      message: `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}? They will ${user.isActive ? 'no longer' : 'now'} be able to log in.`,
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.patch(`/auth/users/${user._id}/status`);
          fetchUsers();
        } catch (error) {
          setModal({ isOpen: true, title: 'Error', message: error.response?.data?.message || 'Action failed', type: 'alert' });
        }
      }
    });
  };

  const handleDeleteUser = (user) => {
    setModal({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`,
      type: 'confirm',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await api.delete(`/auth/users/${user._id}`);
          fetchUsers();
        } catch (error) {
          setModal({ isOpen: true, title: 'Error', message: error.response?.data?.message || 'Delete failed', type: 'alert' });
        }
      }
    });
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', gap: '2rem' }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={20} color="var(--primary)" /> Add Team Member
        </h3>
        <form onSubmit={handleCreateUser}>
          <div className="input-group">
            <label className="input-label">Name</label>
            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Role</label>
            <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
              <option value="Viewer">Viewer (Watch only)</option>
              <option value="Editor">Editor (Upload & Watch)</option>
              <option value="Admin">Admin (Full Access)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Member'}
          </button>
        </form>
      </div>

      <div style={{ flex: 1, borderLeft: '1px solid var(--surface-border)', paddingLeft: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--primary)" /> Organization Members
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {users.map(u => (
            <div key={u._id} className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.isActive ? 'var(--status-safe)' : 'var(--status-flagged)', boxShadow: u.isActive ? '0 0 10px var(--status-safe)' : '0 0 10px var(--status-flagged)' }}></div>
                <div>
                  <div style={{ fontWeight: 600, color: u.isActive ? 'var(--text-main)' : 'var(--text-muted)' }}>{u.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="status-tag" style={{ border: '1px solid var(--primary)', color: 'var(--text-main)', background: 'transparent' }}>
                  {u.role}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleToggleStatus(u)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: u.isActive ? 'var(--status-flagged)' : 'var(--status-safe)', display: 'flex', alignItems: 'center' }}
                    title={u.isActive ? 'Deactivate User' : 'Activate User'}
                  >
                    {u.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(u)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    title="Delete User"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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

export default TeamManagement;
