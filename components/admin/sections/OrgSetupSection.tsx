
import React, { useState } from 'react';
import { User, Region, District, Zone, Area, Chapter, EventType } from '../../../types';
import { apiService } from '../../../services/apiService';
import Icon from '../../ui/Icon';
import { OrgUnitFormModal, ConfirmationModal, EventTypeFormModal } from '../AdminModals';

type OrgUnit = Region | District | Zone | Area | Chapter;

const OrgList: React.FC<{ title: string; items: {id: string; name: string}[]; onEdit: (item: any) => void; onDelete: (item: any) => void; onAdd: () => void; }> = ({ title, items, onEdit, onDelete, onAdd }) => (
    <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</h5>
            <button onClick={onAdd} className="p-1.5 bg-fgbmfi-blue/5 text-fgbmfi-blue rounded-lg hover:bg-fgbmfi-blue/10 transition-colors">
                <Icon name="plus" className="w-3 h-3" />
            </button>
        </div>
        <ul className="space-y-2 flex-1 max-h-64 overflow-y-auto pr-1">
            {items && items.length > 0 ? items.map(item => (
                <li key={item.id} className="p-3 bg-gray-50/50 rounded-xl flex items-center group hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate">{item.name}</div>
                        <div className="text-[9px] font-mono text-gray-400 truncate tracking-tight">{item.id}</div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(item)} className="p-1.5 text-fgbmfi-blue hover:bg-fgbmfi-blue/5 rounded-lg"><Icon name="edit" className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDelete(item)} className="p-1.5 text-fgbmfi-red hover:bg-fgbmfi-red/5 rounded-lg"><Icon name="trash" className="w-3.5 h-3.5" /></button>
                    </div>
                </li>
            )) : <li className="text-[10px] text-gray-300 p-8 text-center font-bold uppercase tracking-widest border-2 border-dashed border-gray-50 rounded-2xl">Empty Registry</li>}
        </ul>
    </div>
);

const OrgSetupSection: React.FC<{ orgData: any; setOrgData: (data: any) => void; users: User[]; setUsers: (u: User[]) => void; forceRefresh: () => void; }> = ({ orgData, setOrgData, users, setUsers, forceRefresh }) => {
    const [modalState, setModalState] = useState<{isOpen: boolean; unit: Partial<OrgUnit> | null; type: string;}>({ isOpen: false, unit: null, type: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; unit: any; type: string } | null>(null);
    const [eventTypeModal, setEventTypeModal] = useState<{ isOpen: boolean; item: EventType | null }>({ isOpen: false, item: null });

    const handleSave = async (unitToSave: any, originalId?: string) => {
        setIsSaving(true);
        try {
            switch(modalState.type) {
                case 'Region': await apiService.upsertRegion(unitToSave); break;
                case 'District': await apiService.upsertDistrict(unitToSave); break;
                case 'Zone': await apiService.upsertZone(unitToSave); break;
                case 'Area': await apiService.upsertArea(unitToSave); break;
                case 'Chapter': await apiService.upsertChapter(unitToSave); break;
            }
            forceRefresh();
            setModalState({ isOpen: false, unit: null, type: '' });
        } catch (error: any) {
            alert(`Save failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
      if (!confirmDelete) return;
      setIsSaving(true);
      try {
          switch(confirmDelete.type) {
              case 'Region': await apiService.deleteRegion(confirmDelete.unit.id); break;
              case 'District': await apiService.deleteDistrict(confirmDelete.unit.id); break;
              case 'Zone': await apiService.deleteZone(confirmDelete.unit.id); break;
              case 'Area': await apiService.deleteArea(confirmDelete.unit.id); break;
              case 'Chapter': await apiService.deleteChapter(confirmDelete.unit.id); break;
              case 'EventType': await apiService.deleteEventType(confirmDelete.unit.id); break;
          }
          forceRefresh();
          setConfirmDelete(null);
      } catch (error: any) {
          alert(`Deletion failed. Check for dependent child units. Error: ${error.message}`);
      } finally {
          setIsSaving(false);
      }
    };

    const handleSaveEventType = async (et: EventType) => {
      setIsSaving(true);
      try {
        await apiService.upsertEventType(et);
        forceRefresh();
        setEventTypeModal({ isOpen: false, item: null });
      } catch (e: any) {
        alert("Failed to save event type: " + e.message);
      } finally {
        setIsSaving(false);
      }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">System Registry</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Fellowship Infrastructure</p>
                </div>
                <div className="p-3 bg-fgbmfi-blue/5 text-fgbmfi-blue rounded-2xl">
                    <Icon name="building-office" className="w-6 h-6" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <OrgList title="Regions" items={orgData.regions} onEdit={(item) => setModalState({isOpen: true, unit: item, type: 'Region'})} onDelete={(item) => setConfirmDelete({ isOpen: true, unit: item, type: 'Region' })} onAdd={() => setModalState({isOpen: true, unit: {id: '', name: '', nationalId: 'national'}, type: 'Region'})} />
                <OrgList title="Districts" items={orgData.districts} onEdit={(item) => setModalState({isOpen: true, unit: item, type: 'District'})} onDelete={(item) => setConfirmDelete({ isOpen: true, unit: item, type: 'District' })} onAdd={() => setModalState({isOpen: true, unit: {id: '', name: '', regionId: ''}, type: 'District'})}/>
                <OrgList title="Zones" items={orgData.zones} onEdit={(item) => setModalState({isOpen: true, unit: item, type: 'Zone'})} onDelete={(item) => setConfirmDelete({ isOpen: true, unit: item, type: 'Zone' })} onAdd={() => setModalState({isOpen: true, unit: {id: '', name: '', districtId: ''}, type: 'Zone'})}/>
                <OrgList title="Areas" items={orgData.areas} onEdit={(item) => setModalState({isOpen: true, unit: item, type: 'Area'})} onDelete={(item) => setConfirmDelete({ isOpen: true, unit: item, type: 'Area' })} onAdd={() => setModalState({isOpen: true, unit: {id: '', name: '', zoneId: ''}, type: 'Area'})}/>
                <OrgList title="Chapters" items={orgData.chapters} onEdit={(item) => setModalState({isOpen: true, unit: item, type: 'Chapter'})} onDelete={(item) => setConfirmDelete({ isOpen: true, unit: item, type: 'Chapter' })} onAdd={() => setModalState({isOpen: true, unit: {id: '', name: '', areaId: ''}, type: 'Chapter'})}/>
                
                {/* Event Type Manager */}
                <OrgList title="Event Types" items={orgData.eventTypes} onEdit={(item) => setEventTypeModal({ isOpen: true, item })} onDelete={(item) => setConfirmDelete({ isOpen: true, unit: item, type: 'EventType' })} onAdd={() => setEventTypeModal({ isOpen: true, item: null })} />
            </div>
            
            {modalState.isOpen && (
                <OrgUnitFormModal 
                    isOpen={modalState.isOpen} 
                    onClose={() => setModalState({isOpen: false, unit: null, type: ''})} 
                    onSave={handleSave} 
                    unit={modalState.unit} 
                    unitType={modalState.type} 
                    potentialParents={
                        modalState.type === 'District' ? orgData.regions : 
                        modalState.type === 'Zone' ? orgData.districts : 
                        modalState.type === 'Area' ? orgData.zones : 
                        modalState.type === 'Chapter' ? orgData.areas : []
                    } 
                />
            )}

            {eventTypeModal.isOpen && (
              <EventTypeFormModal 
                isOpen={eventTypeModal.isOpen}
                onClose={() => setEventTypeModal({ isOpen: false, item: null })}
                onSave={handleSaveEventType}
                item={eventTypeModal.item}
              />
            )}
            
            {confirmDelete && (
              <ConfirmationModal 
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                title={`Delete ${confirmDelete.type}?`}
                message={`Are you sure you want to delete "${confirmDelete.unit.name}"? This action may fail if there are dependent reports or units linked to it.`}
                confirmButtonText="Yes, Delete"
                confirmButtonClass="bg-fgbmfi-red"
              />
            )}
            
            {isSaving && (
                <div className="fixed inset-0 bg-white/40 z-[120] flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fgbmfi-blue"></div>
                        <div className="text-fgbmfi-blue font-black uppercase text-[10px] tracking-widest">Processing Cloud Request...</div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default OrgSetupSection;
