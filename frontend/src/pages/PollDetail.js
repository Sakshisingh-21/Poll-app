import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { pollsAPI, votesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Vote, Clock, Users, BarChart3, ArrowLeft, Trash2, Lock, Unlock, Edit } from 'lucide-react';
import PollResults from '../components/PollResults';

const PollDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [adminAction, setAdminAction] = useState('');
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [id]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      const response = await pollsAPI.getById(id);
      
      if (!response.data || !response.data.data || !response.data.data.poll) {
        throw new Error('Invalid poll response structure');
      }
      
      setPoll(response.data.data.poll);
      
      // If user has voted and poll is closed, fetch results
      if (response.data.data.poll.hasVoted && response.data.data.poll.is_closed) {
        fetchResults();
      }
    } catch (error) {
      toast.error('Failed to fetch poll');
      navigate('/polls');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      setLoadingResults(true);
      let response;
      
      if (user && user.role === 'admin') {
        response = await pollsAPI.getAdminResults(id);
      } else {
        response = await pollsAPI.getResults(id);
      }
      
      if (response.data && response.data.data && response.data.data.results) {
        setResults(response.data.data.results);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption) {
      toast.error('Please select an option');
      return;
    }

    setVoting(true);
    
    try {
      const voteData = {
        poll_id: parseInt(id),
        selected_option: selectedOption
      };
      
      console.log('Sending vote data:', voteData);
      
      await votesAPI.cast(voteData);
      
      toast.success('Vote cast successfully!');
      
      // Refresh poll data
      await fetchPoll();
      
      // If poll is closed, show results
      if (poll && poll.is_closed) {
        await fetchResults();
      }
    } catch (error) {
      console.error('Vote error:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to cast vote';
      toast.error(message);
    } finally {
      setVoting(false);
    }
  };

  const handleViewResults = async () => {
    try {
      await fetchResults();
    } catch (error) {
      toast.error('Failed to load results');
    }
  };

  const handleDeletePoll = async () => {
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    setAdminAction('deleting');
    try {
      await pollsAPI.delete(id);
      toast.success('Poll deleted successfully');
      navigate('/polls');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete poll');
    } finally {
      setAdminAction('');
    }
  };

  const handleClosePoll = async () => {
    if (!window.confirm('Are you sure you want to close this poll? Users will no longer be able to vote.')) {
      return;
    }

    setAdminAction('closing');
    try {
      await pollsAPI.close(id);
      toast.success('Poll closed successfully');
      await fetchPoll(); // Refresh poll data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close poll');
    } finally {
      setAdminAction('');
    }
  };

  const handleReopenPoll = async () => {
    if (!window.confirm('Are you sure you want to reopen this poll? Users will be able to vote again.')) {
      return;
    }

    setAdminAction('reopening');
    try {
      await pollsAPI.reopen(id);
      toast.success('Poll reopened successfully');
      await fetchPoll(); // Refresh poll data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reopen poll');
    } finally {
      setAdminAction('');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalVotes = (poll) => {
    return poll.total_votes || 0;
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
        <p>Loading poll...</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Poll not found</h2>
            <button onClick={() => navigate('/polls')} className="btn btn-primary">
              <ArrowLeft size={16} />
              Back to Polls
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <button onClick={() => navigate('/polls')} className="btn btn-outline btn-sm">
            <ArrowLeft size={16} />
            Back to Polls
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {getStatusBadge(poll)}
            {poll.hasVoted && (
              <span style={{ color: '#10b981', fontSize: '0.875rem' }}>
                ✓ You voted
              </span>
            )}
          </div>
        </div>

        <h1 style={{ marginBottom: '1rem' }}>{poll.title}</h1>
        
        {/* Admin Controls */}
        {user && user.role === 'admin' && (
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={handleDeletePoll}
              className="btn btn-danger btn-sm"
              disabled={adminAction === 'deleting'}
            >
              {adminAction === 'deleting' ? (
                <>
                  <div className="spinner"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Poll
                </>
              )}
            </button>
            
            {!(poll.is_closed || new Date(poll.closing_date) <= new Date()) && (
              <Link to={`/admin/polls/${poll.id}/edit`} className="btn btn-outline btn-sm">
                <Edit size={16} />
                Edit Poll
              </Link>
            )}
            
            {!(poll.is_closed || new Date(poll.closing_date) <= new Date()) ? (
              <button
                onClick={handleClosePoll}
                className="btn btn-warning btn-sm"
                disabled={adminAction === 'closing'}
              >
                {adminAction === 'closing' ? (
                  <>
                    <div className="spinner"></div>
                    Closing...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Close Poll
                  </>
                )}
              </button>
            ) : (
              <>
                <Link to={`/polls/${poll.id}/results`} className="btn btn-primary btn-sm">
                  <BarChart3 size={16} />
                  View Results
                </Link>
                <button
                  onClick={handleReopenPoll}
                  className="btn btn-success btn-sm"
                  disabled={adminAction === 'reopening'}
                >
                  {adminAction === 'reopening' ? (
                    <>
                      <div className="spinner"></div>
                      Reopening...
                    </>
                  ) : (
                    <>
                      <Unlock size={16} />
                      Reopen Poll
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', color: '#6b7280' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} />
            <span>{getTotalVotes(poll)} votes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} />
            <span>{(poll.is_closed || new Date(poll.closing_date) <= new Date()) ? 'Closed' : 'Closes'}: {formatDate(poll.closing_date)}</span>
          </div>
        </div>

        {/* Voting Section */}
        {!poll.hasVoted && !(poll.is_closed || new Date(poll.closing_date) <= new Date()) && isAuthenticated && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Cast Your Vote</h3>
            <div className="poll-options">
              {poll.options.map((option, index) => (
                <div
                  key={index}
                  className={`poll-option ${selectedOption === option ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(option)}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name="option"
                      value={option}
                      checked={selectedOption === option}
                      onChange={() => setSelectedOption(option)}
                    />
                    <span style={{ marginLeft: '0.5rem' }}>{option}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleVote}
              className="btn btn-primary btn-lg"
              disabled={voting || !selectedOption}
            >
              {voting ? (
                <>
                  <div className="spinner"></div>
                  Casting Vote...
                </>
              ) : (
                <>
                  <Vote size={16} />
                  Cast Vote
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Section */}
        {showResults && (
          <div style={{ marginBottom: '2rem' }}>
            {loadingResults ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
                <p>Loading results...</p>
              </div>
            ) : (
              <PollResults 
                results={results} 
                isAdmin={user && user.role === 'admin'} 
              />
            )}
          </div>
        )}

        {/* View Results Button */}
        {((poll.hasVoted && (poll.is_closed || new Date(poll.closing_date) <= new Date())) || 
          (user && user.role === 'admin' && (poll.is_closed || new Date(poll.closing_date) <= new Date()))) && 
          !showResults && (
          <div style={{ textAlign: 'center' }}>
            <button onClick={handleViewResults} className="btn btn-primary">
              <BarChart3 size={16} />
              {user && user.role === 'admin' ? 'View Admin Results' : 'View Results'}
            </button>
          </div>
        )}

        {/* Not Authenticated Message */}
        {!isAuthenticated && !poll.is_closed && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <Vote size={48} style={{ marginBottom: '1rem' }} />
            <h3>Login to Vote</h3>
            <p>You need to be logged in to participate in this poll.</p>
            <button onClick={() => navigate('/login')} className="btn btn-primary">
              Login
            </button>
          </div>
        )}

        {/* Poll Closed Message */}
        {(poll.is_closed || new Date(poll.closing_date) <= new Date()) && !poll.hasVoted && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <Clock size={48} style={{ marginBottom: '1rem' }} />
            <h3>Poll Closed</h3>
            <p>This poll is no longer accepting votes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollDetail; 
