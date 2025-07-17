import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { pollsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Calendar, ArrowLeft } from 'lucide-react';

const EditPoll = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    closing_date: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchPoll();
    }
  }, [id]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      console.log('Fetching poll for editing:', id);
      const response = await pollsAPI.getById(id);
      console.log('Fetch poll response:', response);
      
      if (!response.data || !response.data.data || !response.data.data.poll) {
        throw new Error('Invalid poll response structure');
      }
      
      const poll = response.data.data.poll;
      console.log('Poll data for editing:', poll);
      
      // Check if poll is closed
      if (poll.is_closed) {
        toast.error('Cannot edit a closed poll');
        navigate('/polls');
        return;
      }
      
      // Convert the date to local timezone for datetime-local input
      let closingDateFormatted = '';
      if (poll.closing_date) {
        const date = new Date(poll.closing_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        closingDateFormatted = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      const formDataToSet = {
        title: poll.title || '',
        description: poll.description || '',
        options: poll.options || ['', ''],
        closing_date: closingDateFormatted
      };
      
      console.log('Setting form data:', {
        originalDate: poll.closing_date,
        formattedDate: closingDateFormatted,
        formData: formDataToSet
      });
      setFormData(formDataToSet);
    } catch (error) {
      console.error('Fetch poll error:', error);
      toast.error('Failed to fetch poll');
      navigate('/polls');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.closing_date) {
      newErrors.closing_date = 'Closing date is required';
    } else {
      // Convert the datetime-local value to a proper Date object for comparison
      const selectedDate = new Date(formData.closing_date);
      const now = new Date();
      // Add 1 minute buffer to allow for slight time differences
      const bufferTime = new Date(now.getTime() + 60000);
      
      if (selectedDate <= bufferTime) {
        newErrors.closing_date = 'Closing date must be in the future';
      }
    }

    // Validate options
    const validOptions = formData.options.filter(option => option.trim());
    if (validOptions.length < 2) {
      newErrors.options = 'At least 2 options are required';
    }

    // Check for duplicate options
    const optionTexts = validOptions.map(option => option.toLowerCase());
    const uniqueOptions = new Set(optionTexts);
    if (uniqueOptions.size !== validOptions.length) {
      newErrors.options = 'Options must be unique';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convert datetime-local to ISO string for backend
      const closingDate = formData.closing_date ? new Date(formData.closing_date).toISOString() : '';
      
      const pollData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        options: formData.options.filter(option => option.trim()),
        closing_date: closingDate
      };

      console.log('Submitting poll data:', { 
        isEditing, 
        id, 
        originalClosingDate: formData.closing_date,
        convertedClosingDate: closingDate,
        dateComparison: {
          original: new Date(formData.closing_date),
          converted: new Date(closingDate),
          now: new Date()
        },
        pollData 
      });

      let response;
      if (isEditing) {
        response = await pollsAPI.update(id, pollData);
        console.log('Update response:', response);
        toast.success('Poll updated successfully!');
      } else {
        response = await pollsAPI.create(pollData);
        console.log('Create response:', response);
        toast.success('Poll created successfully!');
      }
      
      navigate(`/polls/${response.data.data.poll.id}`);
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      const message = error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} poll`;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
        <p>Loading poll...</p>
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
          <h1 className="card-title">{isEditing ? 'Edit Poll' : 'Create New Poll'}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Poll Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter poll title..."
              disabled={isSubmitting}
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter poll description..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="closing_date" className="form-label">
              <Calendar size={16} />
              Closing Date & Time
            </label>
            <input
              type="datetime-local"
              id="closing_date"
              name="closing_date"
              value={formData.closing_date}
              onChange={handleChange}
              className={`form-input ${errors.closing_date ? 'error' : ''}`}
              disabled={isSubmitting}
            />
            {errors.closing_date && <div className="form-error">{errors.closing_date}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Poll Options
            </label>
            {formData.options.map((option, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="form-input"
                  placeholder={`Option ${index + 1}`}
                  disabled={isSubmitting}
                />
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="btn btn-danger btn-sm"
                    disabled={isSubmitting}
                    style={{ minWidth: '40px' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            
            {errors.options && <div className="form-error">{errors.options}</div>}
            
            {formData.options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="btn btn-outline btn-sm"
                disabled={isSubmitting}
              >
                <Plus size={16} />
                Add Option
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Update Poll' : 'Create Poll'}
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/polls')}
              className="btn btn-outline btn-lg"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPoll; 
