import React from 'react';
import { BarChart3, Users, Clock, User } from 'lucide-react';

const PollResults = ({ results, isAdmin = false }) => {
  if (!results) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        <BarChart3 size={48} style={{ marginBottom: '1rem' }} />
        <p>No results available</p>
      </div>
    );
  }

  const { poll, total_votes, option_results, individual_votes } = results;

  // Find the winning option(s)
  const maxVotes = Math.max(...option_results.map(result => result.votes));
  const winningOptions = option_results.filter(result => result.votes === maxVotes && result.votes > 0);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="poll-results">
      {/* Results Summary */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={20} />
          Final Results
        </h3>
        
        {winningOptions.length > 0 && (
          <div style={{ 
            backgroundColor: '#fef3c7', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            marginBottom: '1rem',
            border: '1px solid #f59e0b'
          }}>
            <h4 style={{ margin: 0, color: '#92400e' }}>
              {winningOptions.length === 1 ? 'Winner' : 'Winners'}:
            </h4>
            <p style={{ margin: '0.5rem 0 0 0', color: '#92400e' }}>
              {winningOptions.map(result => result.option).join(', ')} 
              ({maxVotes} votes)
            </p>
          </div>
        )}

        {/* Results Chart */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {option_results.map((result, index) => (
            <div key={index} className="result-bar" style={{ 
              backgroundColor: '#f8fafc', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  minWidth: '120px',
                  marginRight: '1rem'
                }}>
                  <span style={{ 
                    fontWeight: '500', 
                    fontSize: '1.1rem',
                    minWidth: '20px',
                    textAlign: 'left'
                  }}>
                    {result.option}
                  </span>
                </div>
                <span style={{ 
                  color: '#6b7280', 
                  fontSize: '0.875rem',
                  flex: '1'
                }}>
                  {result.votes} votes ({result.percentage}%)
                </span>
              </div>
              
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#e2e8f0', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${result.percentage}%`,
                  height: '100%',
                  backgroundColor: result.votes === maxVotes && result.votes > 0 ? '#10b981' : '#3b82f6',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Votes (Admin Only) */}
      {isAdmin && individual_votes && individual_votes.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} />
            Individual Votes
          </h3>
          
          <div style={{ 
            backgroundColor: '#f8fafc', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              display: 'grid', 
              gap: '0.5rem',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {individual_votes.map((vote, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  borderRadius: '0.25rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <span style={{ fontWeight: '500' }}>
                      {vote.voter ? vote.voter.name : 'Anonymous'}
                    </span>
                    {vote.voter && (
                      <span style={{ color: '#6b7280', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                        ({vote.voter.email})
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '500', color: '#3b82f6' }}>
                      {vote.selected_option}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      {formatDate(vote.voted_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Anonymous Poll Notice */}
      {isAdmin && poll.is_anonymous && (
        <div style={{ 
          backgroundColor: '#fef3c7', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          marginTop: '1rem',
          border: '1px solid #f59e0b'
        }}>
          <p style={{ margin: 0, color: '#92400e', fontSize: '0.875rem' }}>
            <strong>Note:</strong> This is an anonymous poll. Individual voter information is not available.
          </p>
        </div>
      )}
    </div>
  );
};

export default PollResults; 
