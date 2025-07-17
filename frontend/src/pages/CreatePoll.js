import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Calendar } from 'lucide-react';

const CreatePoll = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    closing_date: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
    } else if (new Date(formData.closing_date) <= new Date()) {
      newErrors.closing_date = 'Closing date must be in the future';
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
      const pollData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        options: formData.options.filter(option => option.trim()),
        closing_date: formData.closing_date
      };

      const response = await pollsAPI.create(pollData);
      
      toast.success('Poll created successfully!');
      navigate(`/polls/${response.data.data.poll.id}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create poll';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Create New Poll</h1>
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
                  Creating Poll...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Poll
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/admin')}
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

export default CreatePoll; 
