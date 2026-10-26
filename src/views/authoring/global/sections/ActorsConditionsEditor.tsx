import { useState } from 'react';
import type { Actor } from '../../../../core/types';
import { PlusIcon, EditIcon, TrashIcon } from '../../../../components/Icons';
import { ActorModal } from '../components/ActorModal';
import { TagListEditor } from '../components/TagListEditor';

interface ActorsConditionsEditorProps {
  actors: Actor[];
  preconditions: string[];
  postconditions: string[];
  onUpdateActors: (actors: Actor[]) => void;
  onUpdatePreconditions: (preconditions: string[]) => void;
  onUpdatePostconditions: (postconditions: string[]) => void;
}

export function ActorsConditionsEditor({
  actors,
  preconditions,
  postconditions,
  onUpdateActors,
  onUpdatePreconditions,
  onUpdatePostconditions,
}: ActorsConditionsEditorProps) {
  const [isActorModalOpen, setIsActorModalOpen] = useState(false);
  const [editingActorIndex, setEditingActorIndex] = useState<number | null>(null);

  // Actor Handlers
  const handleOpenAddActor = () => {
    setEditingActorIndex(null);
    setIsActorModalOpen(true);
  };

  const handleOpenEditActor = (index: number) => {
    setEditingActorIndex(index);
    setIsActorModalOpen(true);
  };

  const handleSaveActor = (data: { name: string; description: string; permissionsOrNeeds: string }) => {
    const actorItem: Actor = {
      id: editingActorIndex !== null ? actors[editingActorIndex].id : `ACT-${Date.now()}`,
      name: data.name,
      description: data.description,
      permissionsOrNeeds: data.permissionsOrNeeds,
    };

    const updated = [...actors];
    if (editingActorIndex !== null) {
      updated[editingActorIndex] = actorItem;
    } else {
      updated.push(actorItem);
    }
    onUpdateActors(updated);
    setIsActorModalOpen(false);
  };

  const handleDeleteActor = (index: number) => {
    const updated = [...actors];
    updated.splice(index, 1);
    onUpdateActors(updated);
  };

  // Preconditions handlers
  const handleAddPrecondition = (item: string) => {
    onUpdatePreconditions([...preconditions, item]);
  };
  const handleRemovePrecondition = (index: number) => {
    const list = [...preconditions];
    list.splice(index, 1);
    onUpdatePreconditions(list);
  };

  // Postconditions handlers
  const handleAddPostcondition = (item: string) => {
    onUpdatePostconditions([...postconditions, item]);
  };
  const handleRemovePostcondition = (index: number) => {
    const list = [...postconditions];
    list.splice(index, 1);
    onUpdatePostconditions(list);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">3. Aktor & Pengguna Sistem (Actors)</h3>
          <p className="text-xs text-slate-500">Peran pengguna dan hak akses yang berinteraksi dengan sistem.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddActor}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          Tambah Aktor
        </button>
      </div>

      {actors.length === 0 ? (
        <p className="text-xs text-slate-400 py-2 italic text-center">Belum ada aktor yang didaftarkan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="py-2.5 px-3 font-semibold w-40">Nama Aktor / Role</th>
                <th className="py-2.5 px-3 font-semibold">Deskripsi Peran</th>
                <th className="py-2.5 px-3 font-semibold w-64">Hak Akses / Izin Khusus</th>
                <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {actors.map((actor, idx) => (
                <tr key={actor.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{actor.name}</td>
                  <td className="py-2.5 px-3 leading-relaxed">{actor.description || '—'}</td>
                  <td className="py-2.5 px-3">{actor.permissionsOrNeeds || '—'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditActor(idx)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteActor(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        <TagListEditor
          title="Prakondisi Global (Preconditions)"
          placeholder="Tambah prakondisi..."
          items={preconditions}
          onAdd={handleAddPrecondition}
          onRemove={handleRemovePrecondition}
          theme="slate"
        />

        <TagListEditor
          title="Pascakondisi Global (Postconditions)"
          placeholder="Tambah pascakondisi..."
          items={postconditions}
          onAdd={handleAddPostcondition}
          onRemove={handleRemovePostcondition}
          theme="slate"
        />
      </div>

      {/* Modal: Add/Edit Actor */}
      <ActorModal
        isOpen={isActorModalOpen}
        onClose={() => setIsActorModalOpen(false)}
        initialActor={editingActorIndex !== null ? actors[editingActorIndex] : null}
        onSave={handleSaveActor}
      />
    </div>
  );
}

