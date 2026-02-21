import React, { useState, useContext, useEffect } from 'react';
import { User, Role } from '../../../types';
import { AuthContext } from '../../../context/AuthContext';
import { apiService } from '../../../services/apiService';
import Icon from '../../ui/Icon';
import { UserFormModal, ConfirmationModal } from '../AdminModals';

interface UserManagementSectionProps {
    orgData: any;
    users: User[];
    setUsers: (u: User[]) => void;
}

const UserManagementSection: React.FC<UserManagementSectionProps> = ({ orgData, users, setUsers }) => {
    const { user: currentUser } = useContext(AuthContext);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [statusNote, setStatusNote] = useState<{msg: string, type: 'success' | 'error' | 'info' | 'delegated', showFix?: boolean} | null>(null);
    
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId: string; userName: string }>({
        isOpen: false,
        userId: '',
        userName: ''
    });

    useEffect(() => {
        refreshUserList();
    }, [showArchived]);

    const refreshUserList = async () => {
        setIsLoading(true);
        try {
            const dbUsers = showArchived ? await apiService.getArchivedUsers() : await apiService.getUsers();
            setUsers(dbUsers);
        } catch (error: any) {
            console.error("Registry load failure:", error);
            setStatusNote({ msg: `Registry Sync failed: ${error.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveUser = async (userToSave: User, originalId?: string) => {
        setIsLoading(true);
        setStatusNote(null);
        try {
            let finalUserId = originalId || userToSave.id;
            const isNew = !originalId;

            if (isNew) {
                try {
                    const authUser = await apiService.createNewUserAuth(userToSave.email);
                    if (!authUser) throw new Error("Could not create cloud authentication record.");
                    finalUserId = authUser.id;
                } catch (authErr: any) {
                    if (authErr.message === "ALREADY_EXISTS") {
                        throw new Error(`The email "${userToSave.email}" already has a login account.`);
                    }
                    throw authErr;
                }
            }

            const profileData = { ...userToSave, id: finalUserId };
            const syncStatus = await apiService.upsertUser(profileData);
            
            // If we were in archived view and just reactivated someone (role changed from FORMER_OFFICER)
            // or if we just updated an archived user, it's better to go back to active registry
            // to confirm they are now visible there.
            if (showArchived && userToSave.role !== Role.FORMER_OFFICER) {
                setShowArchived(false);
            } else {
                await refreshUserList();
            }
            
            setModalOpen(false);

            if (syncStatus === 'RLS_DELEGATED') {
                setStatusNote({ msg: `Account Provisioned. Officer will complete profile setup on login.`, type: 'delegated' });
            } else {
                setStatusNote({ msg: `Officer registry updated successfully.`, type: 'success' });
            }
        } catch (error: any) {
            let msg = error.message;
            const isAccessError = msg.includes("RLS") || msg.includes("Blocked") || msg.includes("permission");
            
            if (msg.includes("already has a login account")) {
                msg = `CRITICAL: The email "${userToSave.email}" is already registered in Supabase Auth. 
                       Since the previous officer was removed, you must either:
                       1. Use a different email for this new officer.
                       2. Contact the National Admin to permanently delete the old Auth account from the Supabase Dashboard.`;
            }
            setStatusNote({ msg, type: 'error', showFix: isAccessError });
        } finally {
            setIsLoading(false);
        }
    };

    const triggerDelete = (userId: string, userName: string) => {
        if (currentUser && userId === currentUser.id) {
            setStatusNote({ msg: "Security Policy: You cannot delete your own profile while logged in.", type: 'error' });
            return;
        }
        setDeleteConfirm({ isOpen: true, userId, userName });
    };

    const handleConfirmDelete = async () => {
        const { userId, userName } = deleteConfirm;
        setDeleteConfirm({ ...deleteConfirm, isOpen: false });
        setIsLoading(true);
        setStatusNote(null);
        try {
            await apiService.deleteUser(userId);
            setStatusNote({ msg: `Officer profile for ${userName} has been archived. Historical reports are preserved.`, type: 'success' });
            setUsers(users.filter(u => u.id !== userId));
            await refreshUserList();
        } catch (error: any) {
            const isAccessError = error.message.includes("Access Denied") || 
                                 error.message.includes("permission") || 
                                 error.message.includes("Cloud Security") ||
                                 error.message.includes("RLS") ||
                                 error.message.includes("Blocked");
            
            setStatusNote({ 
                msg: isAccessError ? `Action Blocked: ${error.message}` : error.message, 
                type: 'error',
                showFix: isAccessError
            });
            setIsLoading(false);
        }
    };

    const getUnitName = (user: User) => {
        if (user.unitId === 'national') return 'National HQ';
        const list = (() => {
            switch (user.role) {
                case Role.CHAPTER_PRESIDENT: return orgData.chapters;
                case Role.FIELD_REPRESENTATIVE: return orgData.areas;
                case Role.NATIONAL_DIRECTOR: return orgData.zones;
                case Role.DISTRICT_COORDINATOR:
                case Role.DISTRICT_ADMIN: return orgData.districts;
                case Role.REGIONAL_VICE_PRESIDENT:
                case Role.REGIONAL_ADMIN: return orgData.regions;
                default: return [];
            }
        })();
        const unit = list?.find((i: any) => i.id === user.unitId);
        return unit ? unit.name : user.unitId;
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[400px]">
            {isLoading && (
                <div className="absolute inset-0 bg-white/40 z-40 flex items-center justify-center backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fgbmfi-blue"></div>
                </div>
            )}

            {statusNote && (
                <div className={`p-4 border-b ${
                    statusNote.type === 'error' ? 'bg-red-50 text-red-800 border-red-100' : 
                    statusNote.type === 'delegated' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                    'bg-green-50 text-green-800 border-green-100'
                }`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center text-xs font-black uppercase tracking-tight">
                            <Icon name={statusNote.type === 'error' ? 'close' : 'report'} className="w-4 h-4 mr-2" />
                            {statusNote.msg}
                        </div>
                        <button onClick={() => setStatusNote(null)} className="text-[10px] font-black uppercase opacity-50">Dismiss</button>
                    </div>
                    {statusNote.showFix && (
                        <div className="mt-3 p-3 bg-white/50 rounded-xl border border-red-100 text-[10px] text-red-900 leading-relaxed font-medium">
                            <p className="font-black text-[11px] mb-1">🔧 HOW TO FIX THIS:</p>
                            To authorize deletions, your Admin account needs a "DELETE Policy" in Supabase. 
                            Please run the SQL command provided in the technical manual in your Supabase SQL Editor to enable officer removal.
                        </div>
                    )}
                </div>
            )}

            <div className="p-6 border-b flex justify-between items-center">
                 <div className="flex items-center space-x-4">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Officer Registry</h3>
                    <div className="h-4 w-[1px] bg-gray-200"></div>
                    <button 
                        onClick={() => setShowArchived(!showArchived)}
                        className={`text-[10px] font-black uppercase tracking-tight px-3 py-1 rounded-full transition-all ${
                            showArchived 
                            ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                    >
                        {showArchived ? 'Viewing Archived' : 'Show Archived'}
                    </button>
                 </div>
                 <button onClick={() => { setEditingUser(null); setModalOpen(true); }} className="px-5 py-2.5 bg-fgbmfi-blue text-white text-xs font-black rounded-2xl shadow-lg flex items-center transition-transform hover:scale-105">
                    <Icon name="plus" className="w-3 h-3 mr-2" /> Add New Officer
                 </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                        <tr>
                            <th className="px-6 py-4 text-left">Details</th>
                            <th className="px-6 py-4 text-left">Designation</th>
                            <th className="px-6 py-4 text-left">Assigned Unit</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {users.length > 0 ? users.map((u) => (
                            <tr key={u.id} className={`hover:bg-gray-50/50 transition-colors ${showArchived ? 'opacity-75' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{u.name}</div>
                                    <div className="text-[10px] text-gray-400 font-medium">{u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                                        u.role === Role.FORMER_OFFICER 
                                        ? 'bg-gray-100 text-gray-400' 
                                        : 'bg-fgbmfi-blue/5 text-fgbmfi-blue'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-gray-500">{getUnitName(u)}</td>
                                <td className="px-6 py-4 text-right space-x-4">
                                    <button 
                                        onClick={() => { setEditingUser(u); setModalOpen(true); }} 
                                        className={`text-[10px] font-black uppercase ${showArchived ? 'text-orange-600 hover:underline' : 'text-fgbmfi-blue hover:underline'}`}
                                    >
                                        {showArchived ? 'Reactivate' : 'Edit'}
                                    </button>
                                    {!showArchived && (
                                        <button 
                                            onClick={() => triggerDelete(u.id, u.name)} 
                                            disabled={isLoading}
                                            className="text-[10px] font-black uppercase text-red-400 hover:text-red-600 disabled:opacity-30"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">
                                {showArchived ? 'No Archived Officers Found' : 'No Registered Officers Found'}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <UserFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveUser} user={editingUser} orgData={orgData} />
            
            <ConfirmationModal 
                isOpen={deleteConfirm.isOpen} 
                onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} 
                onConfirm={handleConfirmDelete} 
                title="Archive Officer Profile?" 
                message={`Are you sure you want to remove the officer profile for "${deleteConfirm.userName}"? 
                          This will archive their profile and block their access. 
                          IMPORTANT: All historical reports submitted by this officer will be PERMANENTLY PRESERVED in the system.`}
                confirmButtonText="Yes, Archive"
                confirmButtonClass="bg-orange-600"
            />
        </div>
    );
};
export default UserManagementSection;