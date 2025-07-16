import React, { useState } from 'react';
import { changePassword } from '../api/users';
import { useToast } from '../hooks/useToast';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const initialState = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ChangePasswordModal({
  open,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs: { [k: string]: string } = {};
    if (!form.oldPassword) errs.oldPassword = 'Ancien mot de passe requis';
    if (!form.newPassword) errs.newPassword = 'Nouveau mot de passe requis';
    if (form.newPassword && form.newPassword.length < 8)
      errs.newPassword = '8 caractères minimum';
    if (!form.confirmPassword) errs.confirmPassword = 'Confirmation requise';
    if (
      form.newPassword &&
      form.confirmPassword &&
      form.newPassword !== form.confirmPassword
    )
      errs.confirmPassword = 'La confirmation ne correspond pas';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await changePassword(
        form.oldPassword,
        form.newPassword,
        form.confirmPassword
      );
      toast.success(
        'Mot de passe modifié avec succès. Vous allez être déconnecté.'
      );
      setTimeout(() => {
        setLoading(false);
        setForm(initialState);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || 'Erreur lors du changement de mot de passe');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in-up">
        <button
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
          onClick={onClose}
          aria-label="Fermer"
          disabled={loading}
        >
          <svg
            className="h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Modifier mon mot de passe
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ancien mot de passe
            </label>
            <input
              type="password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.oldPassword ? 'border-red-500' : 'border-gray-200'
              }`}
              autoComplete="current-password"
              disabled={loading}
            />
            {errors.oldPassword && (
              <div className="text-red-500 text-xs mt-1">
                {errors.oldPassword}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.newPassword ? 'border-red-500' : 'border-gray-200'
              }`}
              autoComplete="new-password"
              disabled={loading}
            />
            {errors.newPassword && (
              <div className="text-red-500 text-xs mt-1">
                {errors.newPassword}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
              }`}
              autoComplete="new-password"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <div className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-md hover:from-blue-600 hover:to-blue-700 transition-all text-base flex items-center justify-center disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
            ) : null}
            {loading ? 'Modification...' : 'Modifier mon mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
