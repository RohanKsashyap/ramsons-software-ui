import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'reset';
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'reset') => void;
  defaultEmail?: string;
}

export function AuthModal({ isOpen, mode, onClose, onSwitchMode, defaultEmail }: AuthModalProps) {
  const { login, requestPasswordReset, resetPassword, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      clearError();
      setSuccessMessage('');
      if (mode === 'reset') {
        setStep('request');
        setResetToken('');
        setPassword('');
      }
      if (defaultEmail) {
        setEmail(defaultEmail);
      }
    } else {
      setEmail('');
      setPassword('');
      setResetToken('');
      setStep('request');
      setSuccessMessage('');
      clearError();
    }
  }, [isOpen, mode, defaultEmail, clearError]);

  if (!isOpen) {
    return null;
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login(email, password);
      setSuccessMessage('Login successful.');
      setTimeout(onClose, 800);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await requestPasswordReset(email);
      setSuccessMessage('Reset token generated. Check your email or use the code shown.');
      setResetToken(response.resetToken);
      setStep('reset');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await resetPassword(email, resetToken, password);
      setSuccessMessage('Password reset successfully. You are now logged in.');
      setTimeout(onClose, 800);
    } catch (err) {
      console.error(err);
    }
  };

  const renderLogin = () => (
    <form className="space-y-4" onSubmit={handleLogin}>
      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => onSwitchMode('reset')}
          className="text-blue-600 hover:underline"
        >
          Forgot password?
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        disabled={loading}
      >
        {loading ? 'Logging in…' : 'Login'}
      </button>
    </form>
  );

  const renderReset = () => (
    <div className="space-y-6">
      {step === 'request' ? (
        <form className="space-y-4" onSubmit={handleRequestReset}>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="reset-email">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => onSwitchMode('login')}
              className="text-blue-600 hover:underline"
            >
              Back to login
            </button>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Sending…' : 'Send Reset Token'}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleResetPassword}>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="reset-token">
              Reset Token
            </label>
            <input
              id="reset-token"
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">Enter the reset code you received.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="reset-password">
              New Password
            </label>
            <input
              id="reset-password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep('request');
                setResetToken('');
                setSuccessMessage('');
              }}
              className="text-blue-600 hover:underline"
            >
              Start over
            </button>
            <button
              type="button"
              onClick={() => onSwitchMode('login')}
              className="text-blue-600 hover:underline"
            >
              Back to login
            </button>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === 'login' ? 'Login' : step === 'request' ? 'Request Password Reset' : 'Reset Password'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="mt-6">
          {mode === 'login' ? renderLogin() : renderReset()}
        </div>
      </div>
    </div>
  );
}