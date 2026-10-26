import { useState } from 'react';
import type { FsdDocument, OpenItem, Approval, ApiHandoffChecklistItem, OpenItemStatus, ApprovalStatus } from '../../core/types';
import { OPEN_ITEM_STATUSES, APPROVAL_STATUSES } from '../../core/constants';
import { PlusIcon, TrashIcon, EditIcon, CheckCircleIcon } from '../../components/Icons';
import { Modal } from '../../components/Modal';

interface OpenItemsApprovalEditorProps {
  fsd: FsdDocument;
  onChange: (updatedFsd: FsdDocument) => void;
}

export function OpenItemsApprovalEditor({ fsd, onChange }: OpenItemsApprovalEditorProps) {
  // Open Item state
  const [isOpenItemModalOpen, setIsOpenItemModalOpen] = useState(false);
  const [editingOiIndex, setEditingOiIndex] = useState<number | null>(null);
  const [oiName, setOiName] = useState('');
  const [oiDesc, setOiDesc] = useState('');
  const [oiStatus, setOiStatus] = useState<OpenItemStatus>('Open');
  const [oiOwner, setOiOwner] = useState('');
  const [oiDueDate, setOiDueDate] = useState('');

  // Approval state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [editingApprIndex, setEditingApprIndex] = useState<number | null>(null);
  const [apprRole, setApprRole] = useState('');
  const [apprResponsibility, setApprResponsibility] = useState('');
  const [apprPerson, setApprPerson] = useState('');
  const [apprStatus, setApprStatus] = useState<ApprovalStatus>('Pending');

  // Checklist state
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [editingChecklistIndex, setEditingChecklistIndex] = useState<number | null>(null);
  const [checkItem, setCheckItem] = useState('');
  const [checkOwner, setCheckOwner] = useState('');
  const [checkNotes, setCheckNotes] = useState('');

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

  // Open Items Handlers
  const handleOpenAddOi = () => {
    setEditingOiIndex(null);
    setOiName('');
    setOiDesc('');
    setOiStatus('Open');
    setOiOwner('');
    setOiDueDate('');
    setIsOpenItemModalOpen(true);
  };

  const handleOpenEditOi = (index: number) => {
    const item = fsd.openItems[index];
    setEditingOiIndex(index);
    setOiName(item.name);
    setOiDesc(item.description);
    setOiStatus(item.status);
    setOiOwner(item.owner);
    setOiDueDate(item.dueDate || '');
    setIsOpenItemModalOpen(true);
  };

  const handleSaveOi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oiName.trim()) return;

    const seq = editingOiIndex !== null ? editingOiIndex + 1 : fsd.openItems.length + 1;
    const prefix = fsd.idConvention.prefix ? `${fsd.idConvention.prefix}-` : '';
    const generatedId = editingOiIndex !== null ? fsd.openItems[editingOiIndex].id : `OI-${prefix}${String(seq).padStart(2, '0')}`;

    const item: OpenItem = {
      id: generatedId,
      name: oiName.trim(),
      description: oiDesc.trim(),
      status: oiStatus,
      owner: oiOwner.trim(),
      dueDate: oiDueDate.trim() || null,
    };

    const updated = [...fsd.openItems];
    if (editingOiIndex !== null) updated[editingOiIndex] = item;
    else updated.push(item);

    updateFsd({ openItems: updated });
    setIsOpenItemModalOpen(false);
  };

  const handleDeleteOi = (index: number) => {
    const updated = [...fsd.openItems];
    updated.splice(index, 1);
    updateFsd({ openItems: updated });
  };

  // Approval Handlers
  const handleOpenAddApproval = () => {
    setEditingApprIndex(null);
    setApprRole('');
    setApprResponsibility('');
    setApprPerson('');
    setApprStatus('Pending');
    setIsApprovalModalOpen(true);
  };

  const handleOpenEditApproval = (index: number) => {
    const item = fsd.approvals[index];
    setEditingApprIndex(index);
    setApprRole(item.role);
    setApprResponsibility(item.responsibility);
    setApprPerson(item.person);
    setApprStatus(item.status);
    setIsApprovalModalOpen(true);
  };

  const handleSaveApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apprRole.trim()) return;

    const item: Approval = {
      id: editingApprIndex !== null ? fsd.approvals[editingApprIndex].id : `APPR-${Date.now()}`,
      role: apprRole.trim(),
      responsibility: apprResponsibility.trim(),
      person: apprPerson.trim(),
      status: apprStatus,
    };

    const updated = [...fsd.approvals];
    if (editingApprIndex !== null) updated[editingApprIndex] = item;
    else updated.push(item);

    updateFsd({ approvals: updated });
    setIsApprovalModalOpen(false);
  };

  const handleDeleteApproval = (index: number) => {
    const updated = [...fsd.approvals];
    updated.splice(index, 1);
    updateFsd({ approvals: updated });
  };

  // Checklist Handlers
  const handleOpenAddChecklist = () => {
    setEditingChecklistIndex(null);
    setCheckItem('');
    setCheckOwner('');
    setCheckNotes('');
    setIsChecklistModalOpen(true);
  };

  const handleOpenEditChecklist = (index: number) => {
    const item = fsd.apiHandoffChecklist[index];
    setEditingChecklistIndex(index);
    setCheckItem(item.item);
    setCheckOwner(item.owner);
    setCheckNotes(item.notes);
    setIsChecklistModalOpen(true);
  };

  const handleSaveChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkItem.trim()) return;

    const existing = editingChecklistIndex !== null ? fsd.apiHandoffChecklist[editingChecklistIndex] : null;
    const item: ApiHandoffChecklistItem = {
      id: existing ? existing.id : `CHK-${Date.now()}`,
      item: checkItem.trim(),
      owner: checkOwner.trim(),
      complete: existing ? existing.complete : false,
      notes: checkNotes.trim(),
    };

    const updated = [...fsd.apiHandoffChecklist];
    if (editingChecklistIndex !== null) updated[editingChecklistIndex] = item;
    else updated.push(item);

    updateFsd({ apiHandoffChecklist: updated });
    setIsChecklistModalOpen(false);
  };

  const handleToggleChecklist = (index: number) => {
    const updated = [...fsd.apiHandoffChecklist];
    updated[index] = {
      ...updated[index],
      complete: !updated[index].complete,
    };
    updateFsd({ apiHandoffChecklist: updated });
  };

  const handleDeleteChecklist = (index: number) => {
    const updated = [...fsd.apiHandoffChecklist];
    updated.splice(index, 1);
    updateFsd({ apiHandoffChecklist: updated });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Open Items */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">1. Open Items & Isu Tertunda</h3>
            <p className="text-xs text-slate-500">Isu teknis atau keputusan bisnis yang belum terselesaikan.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddOi}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Open Item
          </button>
        </div>

        {fsd.openItems.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 italic text-center">Belum ada open items terdaftar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-24">ID</th>
                  <th className="py-2.5 px-3 font-semibold w-48">Nama Isu</th>
                  <th className="py-2.5 px-3 font-semibold">Deskripsi</th>
                  <th className="py-2.5 px-3 font-semibold w-28">Status</th>
                  <th className="py-2.5 px-3 font-semibold w-28">Owner</th>
                  <th className="py-2.5 px-3 font-semibold w-24">Due Date</th>
                  <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {fsd.openItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">{item.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-2.5 px-3 leading-relaxed">{item.description || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        item.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'Open'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : item.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{item.owner || '—'}</td>
                    <td className="py-2.5 px-3 font-mono">{item.dueDate || '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditOi(idx)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOi(idx)}
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
      </div>

      {/* 2. Approvals */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">2. Persetujuan Dokumen (Document Approval Sign-off)</h3>
            <p className="text-xs text-slate-500">Daftar pihak yang berwenang menyetujui spesifikasi ini.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddApproval}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Approval
          </button>
        </div>

        {fsd.approvals.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 italic text-center">Belum ada daftar persetujuan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold w-44">Peran / Jabatan</th>
                  <th className="py-2.5 px-3 font-semibold w-44">Nama Pejabat</th>
                  <th className="py-2.5 px-3 font-semibold">Tanggung Jawab Sign-off</th>
                  <th className="py-2.5 px-3 font-semibold w-32">Status</th>
                  <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {fsd.approvals.map((appr, idx) => (
                  <tr key={appr.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{appr.role}</td>
                    <td className="py-2.5 px-3">{appr.person || '—'}</td>
                    <td className="py-2.5 px-3 leading-relaxed">{appr.responsibility || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        appr.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : appr.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : appr.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {appr.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditApproval(idx)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteApproval(idx)}
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
      </div>

      {/* 3. API Handoff Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">3. API Handoff Checklist</h3>
            <p className="text-xs text-slate-500">Checklist kesiapan fungsional sebelum serah terima ke tim Solution Architect / Developer.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddChecklist}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            Tambah Checklist Item
          </button>
        </div>

        {fsd.apiHandoffChecklist.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 italic text-center">Belum ada item serah terima API.</p>
        ) : (
          <div className="space-y-2">
            {fsd.apiHandoffChecklist.map((chk, idx) => (
              <div
                key={chk.id}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${
                  chk.complete ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={chk.complete}
                    onChange={() => handleToggleChecklist(idx)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className={`font-semibold ${chk.complete ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                      {chk.item}
                    </span>
                    {chk.owner && <span className="ml-2 text-slate-500">({chk.owner})</span>}
                    {chk.notes && <p className="text-slate-600 mt-0.5">{chk.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditChecklist(idx)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Edit"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteChecklist(idx)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                    title="Hapus"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Open Item */}
      <Modal
        isOpen={isOpenItemModalOpen}
        onClose={() => setIsOpenItemModalOpen(false)}
        title={editingOiIndex !== null ? 'Edit Open Item' : 'Tambah Open Item'}
      >
        <form onSubmit={handleSaveOi} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Isu / Kebutuhan Tertunda <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Keputusan Provider Payment Gateway"
              value={oiName}
              onChange={(e) => setOiName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rincian Isu & Masalah
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan pertanyaan atau kendala yang membutuhkan klarifikasi..."
              value={oiDesc}
              onChange={(e) => setOiDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={oiStatus}
                onChange={(e) => setOiStatus(e.target.value as OpenItemStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {OPEN_ITEM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penanggung Jawab (Owner)
              </label>
              <input
                type="text"
                placeholder="Nama PIC"
                value={oiOwner}
                onChange={(e) => setOiOwner(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Batas Waktu (Due Date)
            </label>
            <input
              type="date"
              value={oiDueDate}
              onChange={(e) => setOiDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpenItemModalOpen(false)}
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

      {/* Modal: Approval */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title={editingApprIndex !== null ? 'Edit Approval Sign-off' : 'Tambah Approval Sign-off'}
      >
        <form onSubmit={handleSaveApproval} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Peran / Jabatan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Product Owner"
                value={apprRole}
                onChange={(e) => setApprRole(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pejabat
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={apprPerson}
                onChange={(e) => setApprPerson(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tanggung Jawab Sign-off
            </label>
            <input
              type="text"
              placeholder="Contoh: Menyetujui cakupan fungsional dan aturan bisnis"
              value={apprResponsibility}
              onChange={(e) => setApprResponsibility(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Persetujuan
            </label>
            <select
              value={apprStatus}
              onChange={(e) => setApprStatus(e.target.value as ApprovalStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {APPROVAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsApprovalModalOpen(false)}
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

      {/* Modal: Checklist */}
      <Modal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        title={editingChecklistIndex !== null ? 'Edit API Checklist' : 'Tambah API Checklist'}
      >
        <form onSubmit={handleSaveChecklist} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Checklist <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Endpoint Auth Swagger terdokumentasi"
              value={checkItem}
              onChange={(e) => setCheckItem(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              PIC / Penanggung Jawab
            </label>
            <input
              type="text"
              placeholder="Contoh: Backend Lead"
              value={checkOwner}
              onChange={(e) => setCheckOwner(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Serah Terima
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan teknis..."
              value={checkNotes}
              onChange={(e) => setCheckNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsChecklistModalOpen(false)}
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

