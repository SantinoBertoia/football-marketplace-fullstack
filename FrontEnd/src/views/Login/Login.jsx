import './Login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../config/api';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        teamName: '',
        yearFounded: '',
        stadium: '',
        city: '',
        role: 'USER'
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Limpiar mensajes de error cuando el usuario empiece a escribir
        if (error) setError(null);
        if (success) setSuccess(null);
    };

    const handleTabChange = (loginMode) => {
        setIsLogin(loginMode);
        setError(null);
        setSuccess(null);
        // Limpiar datos del formulario al cambiar de tab
        setFormData({
            username: '',
            password: '',
            email: '',
            teamName: '',
            yearFounded: '',
            stadium: '',
            city: '',
            role: 'USER'
        });
    };

    const validateForm = () => {
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!formData.password.trim()) {
            setError('Password is required');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        if (!isLogin) {
            if (!formData.username.trim()) {
                setError('Username is required');
                return false;
            }
            if (formData.username.length < 3) {
                setError('Username must be at least 3 characters long');
                return false;
            }
            if (!formData.teamName.trim()) {
                setError('Team name is required');
                return false;
            }
            if (!formData.yearFounded || formData.yearFounded < 1800 || formData.yearFounded > new Date().getFullYear()) {
                setError('Please enter a valid year founded');
                return false;
            }
            if (!formData.stadium.trim()) {
                setError('Stadium is required');
                return false;
            }
            if (!formData.city.trim()) {
                setError('City is required');
                return false;
            }
        }
        return true;
    };

    const handleLogin = async (loginData) => {
        try {
            const response = await fetch(apiUrl('/api/v1/auth/authenticate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Error: ${response.status}`);
            }

            // Guardar token (el backend devuelve accessToken)
            if (data.accessToken) {
                localStorage.setItem('token', data.accessToken);
            } else if (data.access_token) {
                localStorage.setItem('token', data.access_token);
            }

            setSuccess('Login successful! Redirecting...');

            // Redirigir después de un breve delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const handleRegister = async (registerData) => {
        try {
            const response = await fetch(apiUrl('/api/v1/auth/register'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Error: ${response.status}`);
            }

            setSuccess('Registration successful! You can now log in.');

            // Cambiar automáticamente a la pestaña de login después del registro exitoso
            setTimeout(() => {
                setIsLogin(true);
                setFormData({
                    username: '',
                    password: '',
                    email: formData.email, // Mantener el email
                    teamName: '',
                    yearFounded: '',
                    stadium: '',
                    city: '',
                    role: 'USER'
                });
                setSuccess(null);
            }, 2000);

            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isLogin) {
                const loginData = {
                    email: formData.email.trim(),
                    password: formData.password
                };
                await handleLogin(loginData);
            } else {
                const registerData = {
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    password: formData.password,
                    teamName: formData.teamName.trim(),
                    yearFounded: parseInt(formData.yearFounded),
                    stadium: formData.stadium.trim(),
                    city: formData.city.trim(),
                    role: formData.role
                };
                await handleRegister(registerData);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="containerlogin">
                <div className="auth-container">
                    <div className="auth-header">
                        <div className="logologin">
                            <img src="/images/Logo.png" alt="ScoutMarket Logo" />
                        </div>
                    </div>

                    <div className="auth-tabs">
                        <button
                            className={`tab ${isLogin ? 'active' : ''}`}
                            onClick={() => handleTabChange(true)}
                            disabled={loading}
                        >
                            Login
                        </button>
                        <button
                            className={`tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => handleTabChange(false)}
                            disabled={loading}
                        >
                            Register
                        </button>
                    </div>

                    {/* Mensajes de error y éxito */}
                    {error && (
                        <div className="message error-message">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="message success-message">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={loading}
                            required
                        />

                        {!isLogin && (
                            <>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    required
                                />
                                <input
                                    type="text"
                                    name="teamName"
                                    placeholder="Team Name"
                                    value={formData.teamName}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    required
                                />
                                <input
                                    type="number"
                                    name="yearFounded"
                                    placeholder="Year Founded"
                                    value={formData.yearFounded}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    min="1800"
                                    max={new Date().getFullYear()}
                                    required
                                />
                                <input
                                    type="text"
                                    name="stadium"
                                    placeholder="Stadium"
                                    value={formData.stadium}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    required
                                />
                                <input
                                    type="text"
                                    name="city"
                                    placeholder="City"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                    required
                                />
                            </>
                        )}

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={loading}
                            required
                        />

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? (isLogin ? 'Logging in...' : 'Signing up...') : (isLogin ? 'Log In' : 'Sign Up')}
                        </button>
                    </form>

                    {isLogin && (
                        <a href="#" className="forgot-password">Forgot your password?</a>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Login;
