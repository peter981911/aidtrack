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
    <div className="flex min-h-screen relative overflow-hidden bg-surface-50">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-light/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-32 left-1/2 w-[500px] h-[500px] bg-secondary-light/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-dark">
        <img
          src="/images/aid_distribution_hero.png"
          alt="Aid Distribution"
          className="absolute inset-0 w-full h-full object-cover opacity-90 animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/90 via-primary-dark/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-16 text-white animate-slide-up">
          <h1 className="text-5xl font-heading font-bold mb-6 leading-tight">Delivering Hope, <br />One Package at a Time.</h1>
          <p className="text-xl text-white/90 max-w-lg font-light leading-relaxed">
            Join our platform to efficiently track aid, manage resources, and ensure help reaches those who need it most.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md animate-slide-in-right">

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-heading font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-lg text-gray-600">
              Sign in to manage aid distribution
            </p>
          </div>

          <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-xl ring-1 ring-white/50">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-sm font-medium animate-slide-up">
                {error}
              </div>
            )}

            <div className="flex p-1 mb-8 bg-surface-100/80 rounded-xl backdrop-blur-sm">
              <button
                type="button"
                onClick={() => { setLoginMethod('email'); setIdentifier(''); }}
                className={`w-1/2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${loginMethod === 'email' ? activeTabClass : inactiveTabClass}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('username'); setIdentifier(''); }}
                className={`w-1/2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${loginMethod === 'username' ? activeTabClass : inactiveTabClass}`}
              >
                Username
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {loginMethod === 'email' ? (
                <div className="animate-fade-in">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 rounded-xl glass-input placeholder-gray-400 text-gray-900 outline-none text-base"
                    placeholder="name@company.com"
                  />
                </div>
              ) : (
                <div className="animate-fade-in">
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Username</label>
                  <input
                    id="username"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 rounded-xl glass-input placeholder-gray-400 text-gray-900 outline-none text-base"
                    placeholder="e.g. volunteer_01"
                  />
                </div>
              )}

              <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label htmlFor="password" class="block text-sm font-semibold text-gray-700">Password</label>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 rounded-xl glass-input placeholder-gray-400 text-gray-900 outline-none text-base"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <Button type="submit" variant="primary" className="w-full py-4 text-base font-semibold shadow-xl shadow-primary/30 rounded-xl hover:-translate-y-1 transition-transform" isLoading={isLoading}>
                  Sign In to Dashboard
                </Button>
              </div>

              <div className="pt-6 text-center border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-bold text-primary hover:text-primary-dark transition-colors">
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;