import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pollsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Vote, Clock, Users, Filter, Trash2 } from 'lucide-react';

const PollList = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [deletingPollId, setDeletingPollId] = useState(null);

  useEffect(() => {
    fetchPolls();
  }, [filter, pagination.page]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filter !== 'all' && { status: filter })
      };

      console.log('PollList - Fetching polls with params:', params);
      const response = await pollsAPI.getAll(params);
      console.log('PollList - Response:', response);
      
      // Handle the response safely - fix the data structure access
      if (response.data && response.data.data && response.data.data.polls) {
        console.log('PollList - Setting polls:', response.data.data.polls);
        setPolls(response.data.data.polls);
        
        // Set pagination with fallback values
        if (response.data.data.pagination) {
          setPagination(response.data.data.pagination);
        } else {
          // Fallback pagination if not provided by API
          setPagination(prev => ({
            ...prev,
            total: response.data.data.polls.length,
            pages: 1
          }));
        }
      } else {
        console.log('PollList - No polls data found in response');
        setPolls([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
          pages: 0
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch polls');
      console.error('Error fetching polls:', error);
      setPolls([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        pages: 0
      }));
    } finally {
      setLoading(false);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalVotes = (poll) => {
    return poll.total_votes || 0;
  };

  const handlePageChange = (newPage) => {
    if (pagination && newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setDeletingPollId(pollId);
    try {
      await pollsAPI.delete(pollId);
      toast.success('Poll deleted successfully');
      await fetchPolls(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete poll');
    } finally {
      setDeletingPollId(null);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
        <p>Loading polls...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Polls</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Filter size={16} />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="form-input"
              style={{ width: 'auto' }}
            >
              <option value="all">All Polls</option>
              <option value="open">Open Polls</option>
              <option value="closed">Closed Polls</option>
            </select>
          </div>
        </div>

        {/* Admin Isolation Notice */}
        {user && user.role === 'admin' && (
          <div style={{ 
            backgroundColor: '#dbeafe', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            marginBottom: '1.5rem',
            border: '1px solid #3b82f6'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>Admin View</h4>
            <p style={{ margin: 0, color: '#1e40af', fontSize: '0.875rem' }}>
              You are viewing only the polls you created. You can only manage your own polls.
            </p>
          </div>
        )}

        {polls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Vote size={48} style={{ color: '#6b7280', marginBottom: '1rem' }} />
            <h3>No polls found</h3>
            <p style={{ color: '#6b7280' }}>
              {filter === 'all' 
                ? 'There are no polls available at the moment.'
                : `No ${filter} polls found.`
              }
            </p>
            {console.log('PollList - Rendering: No polls found, polls array:', polls)}
          </div>
        ) : (
          <div className="poll-list">
            {console.log('PollList - Rendering: Showing polls, count:', polls.length)}
            {polls.map((poll) => (
              <div key={poll.id} className="poll-card">
                <div className="poll-question">{poll.title}</div>
                
                <div className="poll-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={14} />
                    <span>{getTotalVotes(poll)} votes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={14} />
                    <span>{(poll.is_closed || new Date(poll.closing_date) <= new Date()) ? 'Closed' : 'Closes'}: {formatDate(poll.closing_date)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  {getStatusBadge(poll)}
                  {poll.hasVoted && (
                    <span style={{ color: '#10b981', fontSize: '0.875rem' }}>
                      ✓ You voted
                    </span>
                  )}
                </div>

                <div className="poll-actions">
                  <Link to={`/polls/${poll.id}`} className="btn btn-primary">
                    <Vote size={16} />
                    {(poll.is_closed || new Date(poll.closing_date) <= new Date()) ? 'View Poll' : (poll.hasVoted ? 'View Details' : 'Vote Now')}
                  </Link>
                  
                  {/* Admin Delete Button */}
                  {user && user.role === 'admin' && (
                    <button
                      onClick={() => handleDeletePoll(poll.id)}
                      className="btn btn-danger btn-sm"
                      disabled={deletingPollId === poll.id}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      {deletingPollId === poll.id ? (
                        <>
                          <div className="spinner"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={16} />
                          Delete
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginTop: '2rem'
          }}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn btn-outline btn-sm"
            >
              Previous
            </button>
            
            <span style={{ color: '#6b7280' }}>
              Page {pagination.page || 1} of {pagination.pages || 1}
            </span>
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="btn btn-outline btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollList; 
