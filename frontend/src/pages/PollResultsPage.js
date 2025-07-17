import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, BarChart3, Users, Clock } from 'lucide-react';
import PollResults from '../components/PollResults';

const PollResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPollAndResults();
  }, [id]);

  const fetchPollAndResults = async () => {
    try {
      setLoading(true);
      
      // Fetch poll details
      const pollResponse = await pollsAPI.getById(id);
      if (!pollResponse.data || !pollResponse.data.data || !pollResponse.data.data.poll) {
        throw new Error('Invalid poll response structure');
      }
      
      setPoll(pollResponse.data.data.poll);
      
      // Fetch results
      let resultsResponse;
      if (user && user.role === 'admin') {
        resultsResponse = await pollsAPI.getAdminResults(id);
      } else {
        resultsResponse = await pollsAPI.getResults(id);
      }
      
      if (resultsResponse.data && resultsResponse.data.data && resultsResponse.data.data.results) {
        setResults(resultsResponse.data.data.results);
      }
    } catch (error) {
      console.error('Failed to fetch poll and results:', error);
      toast.error('Failed to load poll results');
      navigate('/polls');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
        <p>Loading poll results...</p>
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
            <BarChart3 size={20} />
            <h1 style={{ margin: 0 }}>Poll Results</h1>
            {user && user.role === 'admin' && (
              <span className="badge badge-info">Admin View</span>
            )}
          </div>
        </div>

        {/* Poll Info */}
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          marginBottom: '2rem',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ marginBottom: '0.5rem' }}>{poll.title}</h2>
          {poll.description && (
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{poll.description}</p>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', color: '#6b7280', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} />
              <span>{poll.total_votes || 0} votes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} />
              <span>Closed: {new Date(poll.closing_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
        </div>

        <PollResults 
          results={results} 
          isAdmin={user && user.role === 'admin'} 
        />
      </div>
    </div>
  );
};

export default PollResultsPage; 
