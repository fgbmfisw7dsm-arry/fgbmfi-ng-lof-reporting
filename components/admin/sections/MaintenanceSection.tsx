
import React, { useState, useEffect, useContext } from 'react';
import { apiService } from '../../../services/apiService';
import { DataContext } from '../../../context/DataContext';
import { Region, District } from '../../../types';
import Icon from '../../ui/Icon';
import { ConfirmationModal } from '../AdminModals';

const MaintenanceSection: React.FC<{ forceUpdate: () => void }> = ({ forceUpdate }) => {
    const { refreshData } = useContext(DataContext);
    
    // Scoping State
    const [scope, setScope] = useState<'all' | 'region' | 'district'>('all');
    const [targetId, setTargetId] = useState('');
    const [fromYear, setFromYear] = useState(new Date().getFullYear() - 1);
    const [toYear, setToYear] = useState(new Date().getFullYear());
    
    // Registry Data for Dropdowns
    const [regions, setRegions] = useState<Region[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    
    // Operation State
    const [isLoading, setIsLoading] = useState(false);
    const [archivedSuccessfully, setArchivedSuccessfully] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ isOpen: boolean; title: string; message: string; type: 'archive' | 'delete' | 'clear-all' } | null>(null);

    useEffect(() => {
        apiService.getRegions().then(setRegions);
        apiService.getDistricts().then(setDistricts);
    }, []);

    const validate = () => {
        if (fromYear > toYear) {
            setStatusMessage({ text: "Error: 'From Year' cannot be after 'To Year'.", type: 'error' });
            return false;
        }
        if (scope !== 'all' && !targetId) {
            setStatusMessage({ text: "Error: Please select a specific Region or District.", type: 'error' });
            return false;
        }
        return true;
    };

    const handleArchive = async () => {
        if (!validate()) return;
        setIsLoading(true);
        setStatusMessage(null);
        setConfirmAction(null);
        try {
            await apiService.archiveReportsByScope(scope, targetId || 'national', fromYear, toYear);
            setArchivedSuccessfully(true);
            setStatusMessage({ text: `Archive confirmed for ${scope.toUpperCase()} scope (${fromYear}-${toYear}). Scoped wipe is now available for this selection.`, type: 'success' });
            refreshData();
            forceUpdate();
        } catch (e: any) {
            setStatusMessage({ text: `Archival failed: ${e.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteScoped = async () => {
        setIsLoading(true);
        setStatusMessage(null);
        setConfirmAction(null);
        try {
            await apiService.deleteReportsByScope(scope, targetId || 'national', fromYear, toYear);
            setStatusMessage({ text: `Data wipe complete for ${scope.toUpperCase()} (${fromYear}-${toYear}). Records removed from cloud registry.`, type: 'success' });
            setArchivedSuccessfully(false); // Reset to force new archive before next wipe
            refreshData();
            forceUpdate();
        } catch (e: any) {
            setStatusMessage({ text: `Wipe failed: ${e.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearEverything = async () => {
        setIsLoading(true);
        setConfirmAction(null);
        try {
            await apiService.clearAllData();
            setStatusMessage({ text: 'The entire organization registry has been wiped clean.', type: 'success' });
            refreshData();
            forceUpdate();
        } catch (e: any) {
            setStatusMessage({ text: `Global wipe failed: ${e.message}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "block w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-fgbmfi-blue text-sm font-bold";

    return (
        <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fgbmfi-blue mb-4"></div>
                        <p className="text-xs font-black uppercase tracking-widest text-fgbmfi-blue">Processing Cloud Request...</p>
                    </div>
                )}

                <div className="flex items-center mb-6">
                    <div className="p-3 bg-fgbmfi-blue/10 text-fgbmfi-blue rounded-2xl mr-4">
                        <Icon name="archive-box" className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-gray-900 tracking-tight">Scoped Maintenance Console</h4>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Archive & Scoped Wiping</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Target Scope</label>
                        <select value={scope} onChange={(e) => { setScope(e.target.value as any); setTargetId(''); setArchivedSuccessfully(false); }} className={inputClass}>
                            <option value="all">National (All)</option>
                            <option value="region">Specific Region</option>
                            <option value="district">Specific District</option>
                        </select>
                    </div>

                    {scope !== 'all' && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Select {scope === 'region' ? 'Region' : 'District'}</label>
                            <select value={targetId} onChange={(e) => { setTargetId(e.target.value); setArchivedSuccessfully(false); }} className={inputClass}>
                                <option value="">-- Choose Unit --</option>
                                {scope === 'region' ? regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>) : districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">From Year</label>
                        <input type="number" value={fromYear} onChange={e => { setFromYear(parseInt(e.target.value)); setArchivedSuccessfully(false); }} className={inputClass} />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">To Year</label>
                        <input type="number" value={toYear} onChange={e => { setToYear(parseInt(e.target.value)); setArchivedSuccessfully(false); }} className={inputClass} />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 border-t pt-8">
                    <button 
                        onClick={() => setConfirmAction({ type: 'archive', title: 'Start Scoped Archival', message: `Proceed with archiving all reports for the scope [${scope.toUpperCase()}: ${targetId || 'National'}] from ${fromYear} to ${toYear}? This is a safe operation.`, isOpen: true })}
                        className="flex-1 py-4 bg-fgbmfi-blue text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-blue-800 transition-all active:scale-95"
                    >
                        Archive Data
                    </button>

                    <button 
                        onClick={() => setConfirmAction({ type: 'delete', title: 'SCOPED WIPE (DELETION)', message: `Are you sure you want to PERMANENTLY DELETE records for [${scope.toUpperCase()}: ${targetId || 'National'}] between ${fromYear} and ${toYear}? This will remove data from the active registry.`, isOpen: true })}
                        disabled={!archivedSuccessfully}
                        className={`flex-1 py-4 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all ${archivedSuccessfully ? 'bg-fgbmfi-red hover:bg-red-800 animate-in zoom-in' : 'bg-gray-200 cursor-not-allowed opacity-50'}`}
                    >
                        {archivedSuccessfully ? 'Wipe Original Data' : 'Archive First to Wipe'}
                    </button>
                </div>

                {statusMessage && (
                    <div className={`mt-8 p-4 rounded-2xl text-[11px] font-black uppercase tracking-tight border flex items-center ${statusMessage.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                        <Icon name={statusMessage.type === 'error' ? 'close' : 'report'} className="w-4 h-4 mr-3" />
                        {statusMessage.text}
                    </div>
                )}
            </div>

            <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
                <div className="flex items-center mb-6">
                    <div className="p-3 bg-red-100 text-red-600 rounded-2xl mr-4">
                        <Icon name="trash" className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-red-900 tracking-tight">Danger Zone</h4>
                        <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Global System Wipe</p>
                    </div>
                </div>
                <p className="text-sm text-red-700/70 mb-6 leading-relaxed">The action below ignores filters and wipes the entire organizational reporting registry permanently.</p>
                <button 
                    onClick={() => setConfirmAction({ type: 'clear-all', title: 'WIPE ALL SYSTEM DATA?', message: 'This will delete EVERY report ever submitted by EVERY chapter and officer in the entire system. Are you absolutely certain?', isOpen: true })}
                    className="w-full py-4 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
                >
                    Wipe Global Registry Data
                </button>
            </div>

            {confirmAction && (
                <ConfirmationModal 
                    isOpen={confirmAction.isOpen} 
                    onClose={() => setConfirmAction(null)} 
                    onConfirm={confirmAction.type === 'archive' ? handleArchive : confirmAction.type === 'delete' ? handleDeleteScoped : handleClearEverything} 
                    title={confirmAction.title} 
                    message={confirmAction.message}
                    confirmButtonText={confirmAction.type === 'archive' ? 'Confirm Archival' : 'Yes, Delete Permanently'}
                    confirmButtonClass={confirmAction.type === 'archive' ? 'bg-fgbmfi-blue' : 'bg-red-600'}
                />
            )}
        </div>
    );
};
export default MaintenanceSection;
