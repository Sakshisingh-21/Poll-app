import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle, Shield } from 'lucide-react';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerAdmin, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordRequirements = validatePassword(formData.password);
      if (!Object.values(passwordRequirements).every(Boolean)) {
        newErrors.password = 'Password does not meet requirements';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const result = await registerAdmin({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        toast.success('Admin registration successful!');
        navigate('/admin/dashboard');
      } else {
        toast.error(result.error || 'Admin registration failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordRequirements = validatePassword(formData.password);

  return (
    <div className="auth-container">
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
                 <div style={{ 
           backgroundColor: '#dbeafe', 
           padding: '1rem', 
           borderRadius: '0.5rem', 
           marginBottom: '1.5rem',
           border: '1px solid #3b82f6',
           display: 'flex',
           alignItems: 'center',
           gap: '0.5rem'
         }}>
           <Shield size={20} color="#1e40af" />
           <div>
             <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1.1rem' }}>Admin Registration</h3>
             <p style={{ margin: '0.25rem 0 0 0', color: '#1e40af', fontSize: '0.875rem' }}>
               Create an administrator account with full privileges
             </p>
           </div>
         </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              <User size={16} />
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`form-input ${errors.username ? 'error' : ''}`}
              placeholder="Enter your username"
              disabled={isSubmitting}
            />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <Mail size={16} />
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <Lock size={16} />
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
            
            {/* Enhanced password requirements for admin */}
            {formData.password && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ marginBottom: '0.25rem', color: '#6b7280', fontWeight: '500' }}>Admin password requirements:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.125rem' }}>
                  {passwordRequirements.length ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                  <span style={{ color: passwordRequirements.length ? '#10b981' : '#ef4444' }}>
                    At least 8 characters
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.125rem' }}>
                  {passwordRequirements.lowercase ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                  <span style={{ color: passwordRequirements.lowercase ? '#10b981' : '#ef4444' }}>
                    One lowercase letter
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.125rem' }}>
                  {passwordRequirements.uppercase ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                  <span style={{ color: passwordRequirements.uppercase ? '#10b981' : '#ef4444' }}>
                    One uppercase letter
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.125rem' }}>
                  {passwordRequirements.number ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                  <span style={{ color: passwordRequirements.number ? '#10b981' : '#ef4444' }}>
                    One number
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {passwordRequirements.special ? <CheckCircle size={12} color="#10b981" /> : <XCircle size={12} color="#ef4444" />}
                  <span style={{ color: passwordRequirements.special ? '#10b981' : '#ef4444' }}>
                    One special character
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              <Lock size={16} />
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
          </div>



          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Creating Admin Account...
              </>
            ) : (
              <>
                <Shield size={16} />
                Create Admin Account
              </>
            )}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '1.5rem', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid #e5e7eb' 
        }}>
          <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
            Already have an account?
          </p>
          <Link to="/login" className="btn btn-outline btn-sm">
            Login
          </Link>
          <span style={{ margin: '0 0.5rem', color: '#6b7280' }}>or</span>
          <Link to="/register" className="btn btn-outline btn-sm">
            Register as User
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister; 
