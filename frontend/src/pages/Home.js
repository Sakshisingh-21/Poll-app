import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Vote, BarChart3, Users, Clock } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1e293b' }}>
          Welcome to Poll App
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#64748b', marginBottom: '2rem' }}>
          Create polls, vote on important decisions, and see real-time results
        </p>

        {isAuthenticated ? (
          <div>
            <p style={{ marginBottom: '2rem', color: '#64748b' }}>
              Welcome back, <strong>{user?.username}</strong>!
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/polls" className="btn btn-primary btn-lg">
                <Vote size={20} />
                View Polls
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin/polls/create" className="btn btn-success btn-lg">
                  <BarChart3 size={20} />
                  Create Poll
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <Link to="/login" className="btn btn-primary btn-lg">
                Login
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                Register
              </Link>
            </div>
            <Link to="/polls" className="btn btn-secondary btn-lg">
              <Vote size={20} />
              Browse Polls
            </Link>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginTop: '3rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <Vote size={48} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Easy Voting</h3>
          <p style={{ color: '#64748b' }}>
            Participate in polls with just a few clicks. Your vote matters!
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <BarChart3 size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Real-time Results</h3>
          <p style={{ color: '#64748b' }}>
            See live results and beautiful charts after polls close.
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <Users size={48} style={{ color: '#8b5cf6', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Role-based Access</h3>
          <p style={{ color: '#64748b' }}>
            Admins can create and manage polls, users can vote and view results.
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <Clock size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Time-based Polls</h3>
          <p style={{ color: '#64748b' }}>
            Set closing dates for polls to ensure timely decision-making.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home; 
