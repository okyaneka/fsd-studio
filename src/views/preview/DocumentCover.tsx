import type { FsdDocument, Project } from '../../core/types';

interface DocumentCoverProps {
  project?: Project;
  fsd: FsdDocument;
}

export function DocumentCover({ project, fsd }: DocumentCoverProps) {
  const { metadata, idConvention } = fsd;
  const formattedDate = new Date(metadata.updatedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="page cover" id="cover">
      <div>
        <div className="eyebrow">Functional Specification Document</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17324d] tracking-tight mt-4 mb-2">
          {metadata.title}
        </h1>
        <p className="subtitle text-slate-500 text-lg mb-6 leading-relaxed">
          {fsd.overview.objective || 'Spesifikasi Fungsional Perangkat Lunak'}
        </p>

        <div className="cover-band p-5 bg-[#f4f7fa] border-l-4 border-[#2e648e] rounded-r-md text-sm text-[#202a36] leading-relaxed mb-6">
          <strong className="block text-[#17324d] font-bold mb-1">Tujuan Dokumen Ini</strong>
          Mendefinisikan perilaku fungsional yang terlihat oleh pengguna, aturan bisnis, validasi field, interaksi layar, kebutuhan integrasi, dan kriteria penerimaan (acceptance criteria). Rincian implementasi teknis dikelola dalam Technical Design.
        </div>

        <table className="cover-meta w-full text-xs border-collapse my-4">
          <tbody>
            <tr>
              <td className="w-1/3 p-2.5 font-bold bg-[#f4f7fa] border border-[#d7dee7] text-[#17324d]">Proyek</td>
              <td className="p-2.5 border border-[#d7dee7] font-semibold text-[#202a36]">{project?.name || metadata.title}</td>
            </tr>
            {project?.clientName && (
              <tr>
                <td className="p-2.5 font-bold bg-[#f4f7fa] border border-[#d7dee7] text-[#17324d]">Klien / Organisasi</td>
                <td className="p-2.5 border border-[#d7dee7] text-[#202a36]">{project.clientName}</td>
              </tr>
            )}
            <tr>
              <td className="p-2.5 font-bold bg-[#f4f7fa] border border-[#d7dee7] text-[#17324d]">Document ID</td>
              <td className="p-2.5 border border-[#d7dee7] font-mono font-bold text-[#2e648e]">{metadata.code}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#f4f7fa] border border-[#d7dee7] text-[#17324d]">Versi Dokumen</td>
              <td className="p-2.5 border border-[#d7dee7] font-medium text-[#202a36]">v{metadata.version}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#f4f7fa] border border-[#d7dee7] text-[#17324d]">Status</td>
              <td className="p-2.5 border border-[#d7dee7]">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#dceaf5] text-[#17324d]">
                  {metadata.status}
                </span>
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#f4f7fa] border border-[#d7dee7] text-[#17324d]">Penulis / BA</td>
              <td className="p-2.5 border border-[#d7dee7] text-[#202a36]">{metadata.author || 'Business Analyst'}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#f4f7fa] border border-[#d7dee7] text-[#17324d]">Reviewers</td>
              <td className="p-2.5 border border-[#d7dee7] text-[#202a36]">
                {metadata.reviewers.length > 0 ? metadata.reviewers.join(', ') : 'Solution Architect / Product Owner / QA Lead'}
              </td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#f4f7fa] border border-[#d7dee7] text-[#17324d]">Target Release</td>
              <td className="p-2.5 border border-[#d7dee7] text-[#202a36]">{metadata.targetRelease || 'To be confirmed'}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-bold bg-[#f4f7fa] border border-[#d7dee7] text-[#17324d]">Terakhir Diperbarui</td>
              <td className="p-2.5 border border-[#d7dee7] text-[#202a36]">{formattedDate}</td>
            </tr>
            {idConvention.prefix && (
              <tr>
                <td className="p-2.5 font-bold bg-[#f4f7fa] border border-[#d7dee7] text-[#17324d]">Namespace ID Prefix</td>
                <td className="p-2.5 border border-[#d7dee7] font-mono text-[#202a36]">{idConvention.prefix}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cover-footer flex justify-between border-t border-[#d7dee7] pt-3 text-[10px] text-slate-400 font-medium">
        <span>CONFIDENTIAL — INTERNAL PROJECT DOCUMENT</span>
        <span>{metadata.code} · v{metadata.version}</span>
      </div>
    </section>
  );
}

