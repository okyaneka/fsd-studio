import { useState } from 'react';
import type { FsdDocument, Actor, ReferenceItem } from '../../core/types';
import { PlusIcon, TrashIcon, EditIcon } from '../../components/Icons';
import { Modal } from '../../components/Modal';

interface GlobalContextEditorProps {
  fsd: FsdDocument;
  onChange: (updatedFsd: FsdDocument) => void;
}

export function GlobalContextEditor({ fsd, onChange }: GlobalContextEditorProps) {
  // Tag / List input helpers
  const [inScopeInput, setInScopeInput] = useState('');
  const [outScopeInput, setOutScopeInput] = useState('');
  const [assumptionInput, setAssumptionInput] = useState('');
  const [preconditionInput, setPreconditionInput] = useState('');
  const [postconditionInput, setPostconditionInput] = useState('');

  // Actor Modal
  const [isActorModalOpen, setIsActorModalOpen] = useState(false);
  const [editingActorIndex, setEditingActorIndex] = useState<number | null>(null);
  const [actorName, setActorName] = useState('');
  const [actorDesc, setActorDesc] = useState('');
  const [actorPerms, setActorPerms] = useState('');

  // Key-Value Modal (Definitions, Success Outcomes, Dependencies)
  type KvKind = 'definitions' | 'successOutcomes' | 'dependencies';
  const [kvKind, setKvKind] = useState<KvKind>('definitions');
  const [isKvModalOpen, setIsKvModalOpen] = useState(false);
  const [editingKvIndex, setEditingKvIndex] = useState<number | null>(null);
  const [kvLabel, setKvLabel] = useState('');
  const [kvValue, setKvValue] = useState('');

  const updateFsd = (patch: Partial<FsdDocument>) => {
    onChange({
      ...fsd,
      ...patch,
      metadata: {
        ...fsd.metadata,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  // Tag Add / Remove handlers
  const handleAddInScope = () => {
    if (!inScopeInput.trim()) return;
    updateFsd({
      overview: {
        ...fsd.overview,
        inScope: [...fsd.overview.inScope, inScopeInput.trim()],
      },
    });
    setInScopeInput('');
  };

  const handleRemoveInScope = (index: number) => {
    const list = [...fsd.overview.inScope];
    list.splice(index, 1);
    updateFsd({ overview: { ...fsd.overview, inScope: list } });
  };

  const handleAddOutScope = () => {
    if (!outScopeInput.trim()) return;
    updateFsd({
      overview: {
        ...fsd.overview,
        outOfScope: [...fsd.overview.outOfScope, outScopeInput.trim()],
      },
    });
    setOutScopeInput('');
  };

  const handleRemoveOutScope = (index: number) => {
    const list = [...fsd.overview.outOfScope];
    list.splice(index, 1);
    updateFsd({ overview: { ...fsd.overview, outOfScope: list } });
  };

  const handleAddAssumption = () => {
    if (!assumptionInput.trim()) return;
    updateFsd({
      businessContext: {
        ...fsd.businessContext,
        assumptions: [...fsd.businessContext.assumptions, assumptionInput.trim()],
      },
    });
    setAssumptionInput('');
  };

  const handleRemoveAssumption = (index: number) => {
    const list = [...fsd.businessContext.assumptions];
    list.splice(index, 1);
    updateFsd({ businessContext: { ...fsd.businessContext, assumptions: list } });
  };

  const handleAddPrecondition = () => {
    if (!preconditionInput.trim()) return;
    updateFsd({ preconditions: [...fsd.preconditions, preconditionInput.trim()] });
    setPreconditionInput('');
  };

  const handleRemovePrecondition = (index: number) => {
    const list = [...fsd.preconditions];
    list.splice(index, 1);
    updateFsd({ preconditions: list });
  };

  const handleAddPostcondition = () => {
    if (!postconditionInput.trim()) return;
    updateFsd({ postconditions: [...fsd.postconditions, postconditionInput.trim()] });
    setPostconditionInput('');
  };

  const handleRemovePostcondition = (index: number) => {
    const list = [...fsd.postconditions];
    list.splice(index, 1);
    updateFsd({ postconditions: list });
  };

  // Actor Handlers
  const handleOpenAddActor = () => {
    setEditingActorIndex(null);
    setActorName('');
    setActorDesc('');
    setActorPerms('');
    setIsActorModalOpen(true);
  };

  const handleOpenEditActor = (index: number) => {
    const actor = fsd.actors[index];
    setEditingActorIndex(index);
    setActorName(actor.name);
    setActorDesc(actor.description);
    setActorPerms(actor.permissionsOrNeeds);
    setIsActorModalOpen(true);
  };

  const handleSaveActor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actorName.trim()) return;

    const actorItem: Actor = {
      id: editingActorIndex !== null ? fsd.actors[editingActorIndex].id : `ACT-${Date.now()}`,
      name: actorName.trim(),
      description: actorDesc.trim(),
      permissionsOrNeeds: actorPerms.trim(),
    };

    const updatedActors = [...fsd.actors];
    if (editingActorIndex !== null) {
      updatedActors[editingActorIndex] = actorItem;
    } else {
      updatedActors.push(actorItem);
    }

    updateFsd({ actors: updatedActors });
    setIsActorModalOpen(false);
  };

  const handleDeleteActor = (index: number) => {
    const updated = [...fsd.actors];
    updated.splice(index, 1);
    updateFsd({ actors: updated });
  };

  // Key-Value Handlers (Definitions, Outcomes, Dependencies)
  const handleOpenAddKv = (kind: KvKind) => {
    setKvKind(kind);
    setEditingKvIndex(null);
    setKvLabel('');
    setKvValue('');
    setIsKvModalOpen(true);
  };

  const handleOpenEditKv = (kind: KvKind, index: number) => {
    setKvKind(kind);
    setEditingKvIndex(index);
    const item =
      kind === 'definitions'
        ? fsd.overview.definitions[index]
        : kind === 'successOutcomes'
        ? fsd.overview.successOutcomes[index]
        : fsd.businessContext.dependencies[index];
    setKvLabel(item.label);
    setKvValue(item.value);
    setIsKvModalOpen(true);
  };

  const handleSaveKv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kvLabel.trim()) return;

    const entry: ReferenceItem = { label: kvLabel.trim(), value: kvValue.trim() };

    if (kvKind === 'definitions') {
      const list = [...fsd.overview.definitions];
      if (editingKvIndex !== null) list[editingKvIndex] = entry;
      else list.push(entry);
      updateFsd({ overview: { ...fsd.overview, definitions: list } });
    } else if (kvKind === 'successOutcomes') {
      const list = [...fsd.overview.successOutcomes];
      if (editingKvIndex !== null) list[editingKvIndex] = entry;
      else list.push(entry);
      updateFsd({ overview: { ...fsd.overview, successOutcomes: list } });
    } else {
      const list = [...fsd.businessContext.dependencies];
      if (editingKvIndex !== null) list[editingKvIndex] = entry;
      else list.push(entry);
      updateFsd({ businessContext: { ...fsd.businessContext, dependencies: list } });
    }

    setIsKvModalOpen(false);
  };

  const handleDeleteKv = (kind: KvKind, index: number) => {
    if (kind === 'definitions') {
      const list = [...fsd.overview.definitions];
      list.splice(index, 1);
      updateFsd({ overview: { ...fsd.overview, definitions: list } });
    } else if (kind === 'successOutcomes') {
      const list = [...fsd.overview.successOutcomes];
      list.splice(index, 1);
      updateFsd({ overview: { ...fsd.overview, successOutcomes: list } });
    } else {
      const list = [...fsd.businessContext.dependencies];
      list.splice(index, 1);
      updateFsd({ businessContext: { ...fsd.businessContext, dependencies: list } });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Overview & Scope */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          1. Gambaran Umum & Ruang Lingkup (Overview & Scope)
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tujuan Dokumen / Sasaran Bisnis (Objective)
          </label>
          <textarea
            rows={3}
            placeholder="Jelaskan tujuan utama yang ingin dicapai melalui fungsionalitas dalam FSD ini..."
            value={fsd.overview.objective}
            onChange={(e) =>
              updateFsd({
                overview: { ...fsd.overview, objective: e.target.value },
              })
            }
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* In Scope */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-emerald-800">
              In-Scope (Fitur Masuk Cakupan)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah butir in-scope..."
                value={inScopeInput}
                onChange={(e) => setInScopeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInScope();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddInScope}
                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
            <ul className="space-y-1.5 mt-2">
              {fsd.overview.inScope.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950"
                >
                  <span>&bull; {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInScope(idx)}
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Out of Scope */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-rose-800">
              Out-of-Scope (Batas Cakupan)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah butir out-of-scope..."
                value={outScopeInput}
                onChange={(e) => setOutScopeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOutScope();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={handleAddOutScope}
                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
            <ul className="space-y-1.5 mt-2">
              {fsd.overview.outOfScope.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-rose-50/60 border border-rose-100 text-xs text-rose-950"
                >
                  <span>&bull; {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOutScope(idx)}
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Success Outcomes & Definitions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          {/* Success Outcomes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Ukuran Keberhasilan (Success Outcomes)
              </label>
              <button
                type="button"
                onClick={() => handleOpenAddKv('successOutcomes')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                + Tambah
              </button>
            </div>
            {fsd.overview.successOutcomes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada target keberhasilan.</p>
            ) : (
              <div className="space-y-2">
                {fsd.overview.successOutcomes.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-800">{item.label}</div>
                      <div className="text-slate-600 mt-0.5">{item.value}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => handleOpenEditKv('successOutcomes', idx)} className="text-slate-400 hover:text-slate-700 p-1">
                        <EditIcon className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDeleteKv('successOutcomes', idx)} className="text-slate-400 hover:text-red-600 p-1">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Definitions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Glosarium & Definisi Istilah
              </label>
              <button
                type="button"
                onClick={() => handleOpenAddKv('definitions')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                + Tambah
              </button>
            </div>
            {fsd.overview.definitions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada definisi istilah.</p>
            ) : (
              <div className="space-y-2">
                {fsd.overview.definitions.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex justify-between gap-2">
                    <div>
                      <div className="font-mono font-semibold text-slate-800">{item.label}</div>
                      <div className="text-slate-600 mt-0.5">{item.value}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => handleOpenEditKv('definitions', idx)} className="text-slate-400 hover:text-slate-700 p-1">
                        <EditIcon className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDeleteKv('definitions', idx)} className="text-slate-400 hover:text-red-600 p-1">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Business Context & Assumptions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          2. Konteks Bisnis & Asumsi (Business Context)
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Ringkasan Konteks Bisnis (Summary)
          </label>
          <textarea
            rows={3}
            placeholder="Jelaskan latar belakang bisnis, kondisi eksisting sistem, atau proses bisnis yang memicu kebutuhan ini..."
            value={fsd.businessContext.summary}
            onChange={(e) =>
              updateFsd({
                businessContext: { ...fsd.businessContext, summary: e.target.value },
              })
            }
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assumptions */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Asumsi Teknis & Bisnis (Assumptions)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah asumsi..."
                value={assumptionInput}
                onChange={(e) => setAssumptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAssumption();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddAssumption}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
            <ul className="space-y-1.5 mt-2">
              {fsd.businessContext.assumptions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700"
                >
                  <span>&bull; {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssumption(idx)}
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Dependencies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Ketergantungan Eksternal (Dependencies)
              </label>
              <button
                type="button"
                onClick={() => handleOpenAddKv('dependencies')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                + Tambah
              </button>
            </div>
            {fsd.businessContext.dependencies.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada dependensi eksternal.</p>
            ) : (
              <div className="space-y-2">
                {fsd.businessContext.dependencies.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-800">{item.label}</div>
                      <div className="text-slate-600 mt-0.5">{item.value}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => handleOpenEditKv('dependencies', idx)} className="text-slate-400 hover:text-slate-700 p-1">
                        <EditIcon className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDeleteKv('dependencies', idx)} className="text-slate-400 hover:text-red-600 p-1">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Actors & Pre/Postconditions */}
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

        {fsd.actors.length === 0 ? (
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
                {fsd.actors.map((actor, idx) => (
                  <tr key={actor.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{actor.name}</td>
                    <td className="py-2.5 px-3 leading-relaxed">{actor.description || '—'}</td>
                    <td className="py-2.5 px-3">{actor.permissionsOrNeeds || '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditActor(idx)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActor(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
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
          {/* Preconditions */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Prakondisi Global (Preconditions)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah prakondisi..."
                value={preconditionInput}
                onChange={(e) => setPreconditionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPrecondition();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddPrecondition}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
            <ul className="space-y-1 mt-2">
              {fsd.preconditions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700"
                >
                  <span>&bull; {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePrecondition(idx)}
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Postconditions */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Pascakondisi Global (Postconditions)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah pascakondisi..."
                value={postconditionInput}
                onChange={(e) => setPostconditionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPostcondition();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddPostcondition}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
            <ul className="space-y-1 mt-2">
              {fsd.postconditions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700"
                >
                  <span>&bull; {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePostcondition(idx)}
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Add/Edit Actor */}
      <Modal
        isOpen={isActorModalOpen}
        onClose={() => setIsActorModalOpen(false)}
        title={editingActorIndex !== null ? 'Edit Aktor' : 'Tambah Aktor Baru'}
      >
        <form onSubmit={handleSaveActor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Aktor / Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Customer, Finance Admin, System Cron"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi Peran
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan siapa aktor ini dalam interaksi aplikasi..."
              value={actorDesc}
              onChange={(e) => setActorDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Izin Khusus / Kebutuhan Akses
            </label>
            <input
              type="text"
              placeholder="Contoh: Akun terverifikasi, Role FIN_APPROVER"
              value={actorPerms}
              onChange={(e) => setActorPerms(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsActorModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add/Edit Key-Value */}
      <Modal
        isOpen={isKvModalOpen}
        onClose={() => setIsKvModalOpen(false)}
        title={
          kvKind === 'definitions'
            ? 'Definisi Istilah'
            : kvKind === 'successOutcomes'
            ? 'Ukuran Keberhasilan'
            : 'Dependensi Eksternal'
        }
      >
        <form onSubmit={handleSaveKv} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {kvKind === 'definitions' ? 'Istilah / Akronim' : 'Nama / Label'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                kvKind === 'definitions'
                  ? 'Contoh: OTP, KYC, SLA'
                  : kvKind === 'successOutcomes'
                  ? 'Contoh: Conversion Rate'
                  : 'Contoh: Core Banking API'
              }
              value={kvLabel}
              onChange={(e) => setKvLabel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nilai / Penjelasan / Target <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Deskripsi atau parameter..."
              value={kvValue}
              onChange={(e) => setKvValue(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsKvModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

