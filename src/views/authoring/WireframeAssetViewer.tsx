import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { getAssetById, saveScreenWireframeAsset, deleteAssetById } from '../../core/assets';
import { PhotoIcon, TrashIcon, UploadIcon, ExclamationTriangleIcon } from '../../components/Icons';

interface WireframeAssetViewerProps {
  assetId: string | null;
  projectId: string;
  fsdId: string;
  moduleId: string;
  screenId: string;
  onAssetChanged: (newAssetId: string | null) => void;
}

export function WireframeAssetViewer({
  assetId,
  projectId,
  fsdId,
  moduleId,
  screenId,
  onAssetChanged,
}: WireframeAssetViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function loadAsset() {
      if (!assetId) {
        setImageUrl(null);
        return;
      }
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const record = await getAssetById(assetId);
        if (record && active) {
          createdUrl = URL.createObjectURL(record.blob);
          setImageUrl(createdUrl);
        } else if (active) {
          setImageUrl(null);
        }
      } catch (err) {
        if (active) {
          setErrorMessage('Gagal memuat gambar dari penyimpanan lokal.');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadAsset();

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [assetId]);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      // If existing asset, delete old one first
      if (assetId) {
        await deleteAssetById(assetId).catch(() => {});
      }

      const saved = await saveScreenWireframeAsset({
        projectId,
        fsdId,
        moduleId,
        screenId,
        file,
      });

      onAssetChanged(saved.id);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal mengunggah gambar.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAsset = async () => {
    if (!assetId) return;
    try {
      setIsLoading(true);
      await deleteAssetById(assetId);
      onAssetChanged(null);
    } catch (err) {
      setErrorMessage('Gagal menghapus gambar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {imageUrl ? (
        <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-900/5 group flex flex-col items-center justify-center p-3">
          <img
            src={imageUrl}
            alt="Wireframe preview"
            className="max-h-72 object-contain rounded border border-slate-200 shadow-xs bg-white"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <UploadIcon className="w-3.5 h-3.5" />
              Ganti Gambar
            </button>
            <button
              type="button"
              onClick={handleRemoveAsset}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Hapus Gambar
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-6 text-center cursor-pointer transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
            <PhotoIcon className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700">Unggah Gambar Wireframe Lo-Fi</p>
          <p className="text-[11px] text-slate-500 mt-0.5">PNG, JPG, atau WebP (Maksimal 5 MB)</p>
          <button
            type="button"
            className="mt-3 px-3 py-1 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-md shadow-xs hover:bg-blue-50"
          >
            Pilih File
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

