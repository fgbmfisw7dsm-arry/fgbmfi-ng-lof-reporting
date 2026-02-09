
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import Icon from '../ui/Icon';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const { user } = useContext(AuthContext);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Visibility States
    const [isNewVisible, setIsNewVisible] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Reset form state when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setSuccess('');
            setIsSubmitting(false);
            setIsNewVisible(false);
            setIsConfirmVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!user) {
            setError('No active session found. Please log in again.');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Update the password for the current logged-in user session
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            setSuccess('Password updated successfully! Closing...');
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err: any) {
            console.error("Password update error:", err);
            setError(err.message || 'Update failed. You may need to log out and back in.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-fgbmfi-blue focus:border-transparent sm:text-sm transition-all";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl p-10 w-full max-w-md relative animate-in zoom-in duration-200">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-300 hover:text-gray-500 transition-colors p-2" aria-label="Close">
                    <Icon name="close" className="h-8 w-8"/>
                </button>
                
                <div className="mb-8">
                    <h3 className="text-2xl font-black text-fgbmfi-blue tracking-tight">Update Password</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Direct Cloud Security</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">New Password</label>
                        <div className="relative">
                            <input 
                                type={isNewVisible ? 'text' : 'password'} 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                className={inputClass} 
                                required 
                                placeholder="Enter at least 6 characters"
                                autoComplete="new-password" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setIsNewVisible(!isNewVisible)} 
                                className="absolute inset-y-0 right-4 flex items-center text-gray-300 hover:text-gray-500"
                            >
                                <Icon name={isNewVisible ? 'eye-slash' : 'eye'} className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Confirm Password</label>
                        <div className="relative">
                            <input 
                                type={isConfirmVisible ? 'text' : 'password'} 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                className={inputClass} 
                                required 
                                placeholder="Repeat your new password"
                                autoComplete="new-password" 
                            />
                            <button 
                                type="button" 
                                onClick={() => setIsConfirmVisible(!isConfirmVisible)} 
                                className="absolute inset-y-0 right-4 flex items-center text-gray-300 hover:text-gray-500"
                            >
                                <Icon name={isConfirmVisible ? 'eye-slash' : 'eye'} className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-[10px] font-black uppercase text-center">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-[10px] font-black uppercase text-center">
                            {success}
                        </div>
                    )}

                    <div className="mt-8 flex flex-col space-y-3">
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className={`w-full py-4 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all ${isSubmitting ? 'bg-green-600' : 'bg-fgbmfi-blue hover:bg-blue-800'}`}
                        >
                            {isSubmitting ? 'Syncing...' : 'Update Password'}
                        </button>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="w-full py-2 text-gray-400 text-[10px] font-black uppercase hover:text-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
