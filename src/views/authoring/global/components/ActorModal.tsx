import { useState, useEffect } from 'react';
import type { Actor } from '../../../../core/types';
import { Modal } from '../../../../components/Modal';

interface ActorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialActor?: Actor | null;
  onSave: (actorData: { name: string; description: string; permissionsOrNeeds: string }) => void;
}

export function ActorModal({
  isOpen,
  onClose,
  initialActor = null,
  onSave,
}: ActorModalProps) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [perms, setPerms] = useState('');

  useEffect(() => {
    if (initialActor) {
      setName(initialActor.name || '');
      setDesc(initialActor.description || '');
      setPerms(initialActor.permissionsOrNeeds || '');
    } else {
      setName('');
      setDesc('');
      setPerms('');
    }
  }, [initialActor, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: desc.trim(),
      permissionsOrNeeds: perms.trim(),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialActor ? 'Edit Aktor' : 'Tambah Aktor Baru'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nama Aktor / Role <span className="text-red-500">*</span>
          </label>
          <input
            autoFocus
            type="text"
            required
            placeholder="Contoh: Customer, Finance Admin, System Cron"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
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
            value={perms}
            onChange={(e) => setPerms(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}

