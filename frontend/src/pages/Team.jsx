import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TeamManagement from '../components/TeamManagement';
import { Navigate } from 'react-router-dom';

const Team = () => {
  const { user } = useContext(AuthContext);

  if (user?.role !== 'Admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="top-nav">
          <div>
            <h1>Team Settings</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage your organization's members and roles.</p>
          </div>
        </div>
        <TeamManagement />
      </div>
    </div>
  );
};

export default Team;
