// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import Card from './ui/Card';

function LoginForm() {
  const [loginMethod, setLoginMethod] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login, error } = useAuth();

  // If user is already logged in, redirect them immediately
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/volunteer'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await login(identifier, password);
    setIsLoading(false);
  };

  const activeTabClass = 'bg-white shadow-sm text-primary-dark ring-1 ring-black/5';
  const inactiveTabClass = 'text-gray-500 hover:text-gray-700 hover:bg-white/50';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-light/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-light/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-20 w-96 h-96 bg-accent-light/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md p-4 relative z-10 animate-fade-in">
        <Card className="border-t-4 border-t-primary">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading font-bold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-gray-600">
              Sign in to manage aid distribution
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-slide-up">
              {error}
            </div>
          )}

          <div className="flex p-1 mb-6 bg-gray-100/50 rounded-xl">
            <button
              type="button"
              onClick={() => { setLoginMethod('email'); setIdentifier(''); }}
              className={`w-1/2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${loginMethod === 'email' ? activeTabClass : inactiveTabClass}`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('username'); setIdentifier(''); }}
              className={`w-1/2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${loginMethod === 'username' ? activeTabClass : inactiveTabClass}`}
            >
              Username
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {loginMethod === 'email' ? (
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl glass-input placeholder-gray-400 text-gray-900 outline-none"
                  placeholder="name@company.com"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input
                  id="username"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl glass-input placeholder-gray-400 text-gray-900 outline-none"
                  placeholder="e.g. volunteer_01"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" class="block text-sm font-semibold text-gray-700">Password</label>
                {/* Future: Forgot Password Link */}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl glass-input placeholder-gray-400 text-gray-900 outline-none"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full py-3 text-base shadow-xl shadow-primary/20" isLoading={isLoading}>
              Sign In
            </Button>

            <div className="pt-4 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default LoginForm;