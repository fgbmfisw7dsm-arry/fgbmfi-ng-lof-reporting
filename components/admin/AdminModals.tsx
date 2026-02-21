import React, { useState, useEffect } from 'react';
import { User, Role, Region, District, Zone, Area, Chapter, EventType } from '../../types';
import { ROLES } from '../../constants';
import Icon from '../ui/Icon';

type OrgUnit = Region | District | Zone | Area | Chapter;
const inputClass = "mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-fgbmfi-blue focus:border-transparent sm:text-sm transition-all font-bold";
const disabledInputClass = "mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl shadow-sm text-gray-400 cursor-not-allowed sm:text-sm font-bold";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const sortByName = (items: any[]) => [...items].sort((a, b) => collator.compare(a.name, b.name));

export const ConfirmationModal: React.FC<{
    isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmButtonText?: string; confirmButtonClass?: string;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmButtonText = 'Confirm', confirmButtonClass = 'bg-fgbmfi-blue' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[110] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
                <p className="mt-4 text-sm text-gray-500 leading-relaxed">{message}</p>
                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-2xl">Cancel</button>
                    <button onClick={onConfirm} className={`px-6 py-2.5 text-sm font-black text-white ${confirmButtonClass} rounded-2xl shadow-lg`}>{confirmButtonText}</button>
                </div>
            </div>
        </div>
    );
};

export const EventTypeFormModal: React.FC<{
  isOpen: boolean; onClose: () => void; onSave: (item: EventType) => void; item: EventType | null;
}> = ({ isOpen, onClose, onSave, item }) => {
  const [name, setName] = useState('');
  const isEditing = !!item;

  useEffect(() => {
    setName(item?.name || '');
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: item?.id || name.toLowerCase().replace(/\s+/g, '-'), name });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
          <h3 className="text-xl font-black mb-6 text-fgbmfi-blue">{isEditing ? 'Modify' : 'New'} Event Type</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Type Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} required placeholder="e.g. Rally, Seminar, Outreach" />
              </div>
              <div className="mt-8 flex justify-end space-x-3 text-sm font-bold">
                  <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-500 bg-gray-50 rounded-2xl">Cancel</button>
                  <button type="submit" className="px-8 py-2.5 font-black text-white bg-fgbmfi-blue rounded-2xl shadow-xl">Save Type</button>
              </div>
          </form>
      </div>
    </div>
  );
};

export const OrgUnitFormModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (unit: any, originalId?: string) => void; unit: Partial<OrgUnit> | null; unitType: string; potentialParents: OrgUnit[];
}> = ({ isOpen, onClose, onSave, unit, unitType, potentialParents }) => {
    const [formData, setFormData] = useState<any>(unit);
    const isEditing = !!unit?.id;
    useEffect(() => { if (unit) setFormData(unit); }, [unit, isOpen]);
    if (!isOpen || !unit) return null;
    const parentMeta = (() => {
        switch (unitType) {
            case 'Region': return { key: 'nationalId', label: 'National', disabled: true };
            case 'District': return { key: 'regionId', label: 'Region' };
            case 'Zone': return { key: 'districtId', label: 'District' };
            case 'Area': return { key: 'zoneId', label: 'Zone' };
            case 'Chapter': return { key: 'areaId', label: 'Area' };
            default: return null;
        }
    })();
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData, unit?.id); };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-black mb-6 text-fgbmfi-blue">{isEditing ? 'Modify' : 'Create'} {unitType}</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unit Unique ID</label>
                        <input type="text" value={formData?.id || ''} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase().trim()})} className={isEditing ? disabledInputClass : inputClass} required disabled={isEditing} placeholder="e.g. LAG-METRO-01" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Display Name</label>
                        <input type="text" value={formData?.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} required placeholder="e.g. Lagos Metro Chapter" />
                    </div>
                    {parentMeta && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Superior {parentMeta.label}</label>
                            <select value={(formData as any)?.[parentMeta.key] || ''} onChange={e => setFormData({...formData, [parentMeta.key]: e.target.value})} className={inputClass} disabled={parentMeta.disabled} required>
                                {parentMeta.disabled ? <option value="national">National HQ (Nigeria)</option> : (
                                    <>
                                        <option value="">-- Select Parent Unit --</option>
                                        {sortByName(potentialParents)?.map(p => <option key={p.id} value={p.id}>{p.name} [{p.id}]</option>)}
                                    </>
                                )}
                            </select>
                        </div>
                    )}
                    <div className="mt-8 flex justify-end space-x-3 text-sm font-bold">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-500 bg-gray-50 rounded-2xl">Cancel</button>
                        <button type="submit" className="px-8 py-2.5 font-black text-white bg-fgbmfi-blue rounded-2xl shadow-xl">Save {unitType}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const UserFormModal: React.FC<{
    isOpen: boolean; onClose: () => void; onSave: (user: User, originalId?: string) => void; user: User | null; orgData: any;
}> = ({ isOpen, onClose, onSave, user, orgData }) => {
    const [formData, setFormData] = useState<User>({ id: '', name: '', username: '', email: '', phone: '', password: '123456', role: Role.CHAPTER_PRESIDENT, unitId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    useEffect(() => { 
        if (user) {
            const phoneVal = user.phone.startsWith('+234') ? user.phone.replace('+234', '') : user.phone;
            setFormData({ ...user, phone: phoneVal }); 
        } else {
            setFormData({ id: '', name: '', username: '', email: '', phone: '', password: '123456', role: Role.CHAPTER_PRESIDENT, unitId: '' }); 
        }
        setIsSubmitting(false);
        setErrorMsg(null);
    }, [user, isOpen]);

    if (!isOpen) return null;

    const getUnitOptions = () => {
        let units: any[] = [];
        switch (formData.role) {
            case Role.CHAPTER_PRESIDENT: units = orgData.chapters; break;
            case Role.FIELD_REPRESENTATIVE: units = orgData.areas; break;
            case Role.NATIONAL_DIRECTOR: units = orgData.zones; break;
            case Role.DISTRICT_COORDINATOR:
            case Role.DISTRICT_ADMIN: units = orgData.districts; break;
            case Role.REGIONAL_VICE_PRESIDENT:
            case Role.REGIONAL_ADMIN: units = orgData.regions; break;
            default: return [{ id: 'national', name: 'National HQ' }];
        }
        return sortByName(units);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg(null);

        const finalPhone = formData.phone.startsWith('+234') 
            ? formData.phone 
            : `+234${formData.phone.replace(/^0/, '').replace(/[^0-9]/g, '')}`;

        try {
            await onSave({ ...formData, phone: finalPhone }, user?.id);
        } catch (err: any) {
            setErrorMsg(err.message || "An error occurred during registration.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl p-10 w-full max-w-xl overflow-y-auto max-h-[95vh] animate-in slide-in-from-bottom-4 duration-300">
                <div className="pb-6 mb-8 flex justify-between items-start border-b border-gray-100">
                    <div>
                        <h3 className="text-2xl font-black text-fgbmfi-blue tracking-tight">{user ? 'Edit Officer' : 'Register New Officer'}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Single-Pass Cloud Provisioning</p>
                    </div>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors p-2"><Icon name="close" className="w-8 h-8" /></button>
                </div>
                
                {errorMsg && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-black uppercase tracking-tight flex items-center">
                        <Icon name="close" className="w-4 h-4 mr-3 flex-shrink-0" /> {errorMsg}
                    </div>
                )}
                
                <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Officer Full Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} required placeholder="Title Firstname Lastname" disabled={isSubmitting} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Official Email Address</label>
                                <input 
                                    type="email" 
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value.toLowerCase().trim()})} 
                                    className={(user && !user.email.includes('@archived.lof')) ? disabledInputClass : inputClass} 
                                    required 
                                    placeholder="officer@lof-nigeria.org" 
                                    disabled={(!!user && !user.email.includes('@archived.lof')) || isSubmitting} 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Phone Number</label>
                                <div className="relative flex items-center">
                                    <span className="absolute left-4 text-gray-400 font-bold text-sm">+234</span>
                                    <input 
                                        type="text" 
                                        value={formData.phone} 
                                        onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^0-9]/g, '')})} 
                                        className="w-full pl-14 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-fgbmfi-blue text-sm font-bold tracking-wider" 
                                        placeholder="803 000 0000" 
                                        disabled={isSubmitting} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Designated Office</label>
                                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role, unitId: ''})} className={inputClass} disabled={isSubmitting}>
                                    {formData.role === Role.FORMER_OFFICER && <option value={Role.FORMER_OFFICER}>{Role.FORMER_OFFICER} (Archived)</option>}
                                    {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                                {formData.role === Role.FORMER_OFFICER && (
                                    <p className="mt-1 text-[9px] text-orange-600 font-bold uppercase tracking-tight italic">
                                        * Select a new active role to reactivate this officer.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Assigned Organizational Unit</label>
                                <select 
                                    value={formData.unitId} 
                                    onChange={e => setFormData({...formData, unitId: e.target.value})} 
                                    className={inputClass} 
                                    required 
                                    disabled={isSubmitting}
                                >
                                    <option value="">-- Select Unit --</option>
                                    {getUnitOptions()?.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.name} [{u.id}]</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-10 flex justify-end space-x-4 pt-6 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-8 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors" disabled={isSubmitting}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className={`px-10 py-3 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl transition-all ${isSubmitting ? 'bg-green-600' : 'bg-fgbmfi-blue hover:bg-blue-800 hover:scale-105'}`}>
                            {isSubmitting ? 'Syncing...' : (user ? 'Update Profile' : 'Provision Account')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};