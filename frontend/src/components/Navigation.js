import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, BarChart3, Plus, Home, Vote } from 'lucide-react';

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  if (!isAuthenticated) {
    return (
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            Poll App
          </Link>
          <ul className="nav-menu">
            <li>
              <Link to="/polls" className={`nav-link ${isActive('/polls') ? 'active' : ''}`}>
                <Vote size={16} />
                Polls
              </Link>
            </li>
            <li>
              <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className={`nav-link ${isActive('/register') ? 'active' : ''}`}>
                Register
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    );
  }

  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          Poll App
        </Link>
        <ul className="nav-menu">
          <li>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <Home size={16} />
              Home
            </Link>
          </li>
          <li>
            <Link to="/polls" className={`nav-link ${isActive('/polls') ? 'active' : ''}`}>
              <Vote size={16} />
              Polls
            </Link>
          </li>
          
          {user?.role === 'admin' && (
            <>
              <li>
                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                  <BarChart3 size={16} />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/polls/create" className={`nav-link ${isActive('/admin/polls/create') ? 'active' : ''}`}>
                  <Plus size={16} />
                  Create Poll
                </Link>
              </li>
            </>
          )}
          
          <li>
            <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
              <User size={16} />
              Profile
            </Link>
          </li>
          <li>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              <LogOut size={16} />
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation; 
