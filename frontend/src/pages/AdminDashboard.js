import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pollsAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { BarChart3, Users, Vote, Plus, Eye, Edit, Trash2, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPolls: 0,
    activePolls: 0,
    totalUsers: 0,
    totalVotes: 0
  });
  const [recentPolls, setRecentPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Debug effect to log state changes
  useEffect(() => {
    console.log('Stats updated:', stats);
  }, [stats]);

  useEffect(() => {
    console.log('Recent polls updated:', recentPolls);
  }, [recentPolls]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch polls for stats
      console.log('Fetching polls...');
      const pollsResponse = await pollsAPI.getAll({ limit: 100 });
      console.log('Polls response:', pollsResponse);
      
      if (!pollsResponse.data || !pollsResponse.data.data || !pollsResponse.data.data.polls) {
        throw new Error('Invalid polls response structure');
      }
      
      const polls = pollsResponse.data.data.polls;
      console.log('Polls data:', polls);
      
      // Fetch users
      console.log('Fetching users...');
      const usersResponse = await authAPI.getUsers();
      console.log('Users response:', usersResponse);
      
      if (!usersResponse.data || !usersResponse.data.data || !usersResponse.data.data.users) {
        throw new Error('Invalid users response structure');
      }
      
      const users = usersResponse.data.data.users;
      console.log('Users data:', users);
      
      // Calculate stats
      const totalPolls = polls.length;
      const activePolls = polls.filter(poll => !poll.is_closed).length;
      const totalUsers = users.length;
      const totalVotes = polls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0);
      
      console.log('Calculated stats:', { totalPolls, activePolls, totalUsers, totalVotes });
      
      // Update state with new data
      setStats({
        totalPolls,
        activePolls,
        totalUsers,
        totalVotes
      });
      
      // Get recent polls (last 5)
      const recentPollsData = polls.slice(0, 5);
      console.log('Setting recent polls:', recentPollsData);
      setRecentPolls(recentPollsData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error('Failed to fetch dashboard data');
      
      // Reset state on error
      setStats({
        totalPolls: 0,
        activePolls: 0,
        totalUsers: 0,
        totalVotes: 0
      });
      setRecentPolls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm('Are you sure you want to delete this poll?')) {
      try {
        await pollsAPI.delete(pollId);
        toast.success('Poll deleted successfully');
        fetchDashboardData(); // Refresh data
      } catch (error) {
        toast.error('Failed to delete poll');
      }
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      await pollsAPI.close(pollId);
      toast.success('Poll closed successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Failed to close poll');
    }
  };

  const handleReopenPoll = async (pollId) => {
    try {
      await pollsAPI.reopen(pollId);
      toast.success('Poll reopened successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Failed to reopen poll');
    }
  };

  const getStatusBadge = (poll) => {
    // Check if poll is actually expired (client-side check for immediate feedback)
    const isExpired = new Date(poll.closing_date) <= new Date();
    const shouldBeClosed = poll.is_closed || isExpired;
    
    if (shouldBeClosed) {
      return <span className="badge badge-danger">Closed</span>;
    } else {
      return <span className="badge badge-success">Open</span>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalVotes = (poll) => {
    return poll.total_votes || 0;
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Admin Dashboard</h1>
          <Link to="/admin/polls/create" className="btn btn-primary">
            <Plus size={16} />
            Create Poll
          </Link>
        </div>

        {/* Admin Isolation Notice */}
        <div style={{ 
          backgroundColor: '#dbeafe', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1.5rem',
          border: '1px solid #3b82f6'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Admin Isolation</h4>
          <p style={{ margin: 0, color: '#1e40af', fontSize: '0.875rem' }}>
            You can only view and manage polls that you created. This ensures data privacy and security.
          </p>
        </div>

        {/* Statistics */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.totalPolls}</div>
            <div className="stat-label">Total Polls</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.activePolls}</div>
            <div className="stat-label">Active Polls</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalVotes}</div>
            <div className="stat-label">Total Votes</div>
          </div>
        </div>

        {/* Recent Polls */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Recent Polls</h3>
          
          {console.log('Rendering - recentPolls:', recentPolls, 'length:', recentPolls.length)}
          {recentPolls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <BarChart3 size={48} style={{ marginBottom: '1rem' }} />
              <p>No polls created yet.</p>
              <Link to="/admin/polls/create" className="btn btn-primary">
                Create Your First Poll
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {recentPolls.map((poll) => (
                <div key={poll.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0 }}>{poll.title}</h4>
                    {getStatusBadge(poll)}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    <span>
                      <Vote size={14} style={{ marginRight: '0.25rem' }} />
                      {getTotalVotes(poll)} votes
                    </span>
                    <span>
                      <Clock size={14} style={{ marginRight: '0.25rem' }} />
                      Closes: {formatDate(poll.closing_date)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/polls/${poll.id}`} className="btn btn-outline btn-sm">
                      <Eye size={14} />
                      View
                    </Link>
                    <Link to={`/admin/polls/${poll.id}/edit`} className="btn btn-outline btn-sm">
                      <Edit size={14} />
                      Edit
                    </Link>
                    {(poll.is_closed || new Date(poll.closing_date) <= new Date()) && (
                      <Link to={`/polls/${poll.id}/results`} className="btn btn-primary btn-sm">
                        <BarChart3 size={14} />
                        Results
                      </Link>
                    )}
                    {!poll.is_closed ? (
                      <button
                        onClick={() => handleClosePoll(poll.id)}
                        className="btn btn-warning btn-sm"
                      >
                        <Clock size={14} />
                        Close
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReopenPoll(poll.id)}
                        className="btn btn-success btn-sm"
                      >
                        <Clock size={14} />
                        Reopen
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePoll(poll.id)}
                      className="btn btn-danger btn-sm"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/admin/polls/create" className="btn btn-primary">
              <Plus size={16} />
              Create New Poll
            </Link>
            <Link to="/polls" className="btn btn-outline">
              <BarChart3 size={16} />
              View All Polls
            </Link>
            <Link to="/profile" className="btn btn-outline">
              <Users size={16} />
              Manage Users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 
