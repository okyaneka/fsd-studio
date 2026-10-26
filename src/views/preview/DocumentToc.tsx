import { useState, useEffect } from 'react';
import type { FsdDocument, FsdModule } from '../../core/types';

interface DocumentTocProps {
  fsd: FsdDocument;
  activeModuleScope?: string; // 'all' or moduleId
}

export function DocumentToc({ fsd, activeModuleScope = 'all' }: DocumentTocProps) {
  const [activeId, setActiveId] = useState<string>('cover');

  const visibleModules =
    activeModuleScope === 'all'
      ? fsd.modules
      : fsd.modules.filter((m) => m.id === activeModuleScope);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    const sectionElements = document.querySelectorAll('section[id], div[id].toc-target');
    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      sectionElements.forEach((el) => observer.unobserve(el));
    };
  }, [fsd, activeModuleScope]);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      setActiveId(id);
    }
  };

  return (
    <aside className="sidebar no-print sticky top-[72px] max-h-[calc(100vh-92px)] overflow-y-auto bg-white border border-[#d7dee7] rounded-lg p-4 text-xs">
      <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">
        Daftar Isi Dokumen
      </h2>
      <nav id="toc" className="space-y-0.5">
        <a
          href="#cover"
          onClick={(e) => scrollTo(e, 'cover')}
          className={`block px-2.5 py-1.5 rounded transition-colors ${
            activeId === 'cover' ? 'bg-[#eaf2f8] text-[#174d76] font-bold' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          Halaman Sampul
        </a>
        <a
          href="#control"
          onClick={(e) => scrollTo(e, 'control')}
          className={`block px-2.5 py-1.5 rounded transition-colors ${
            activeId === 'control' ? 'bg-[#eaf2f8] text-[#174d76] font-bold' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          1. Document Control
        </a>
        <a
          href="#overview"
          onClick={(e) => scrollTo(e, 'overview')}
          className={`block px-2.5 py-1.5 rounded transition-colors ${
            activeId === 'overview' ? 'bg-[#eaf2f8] text-[#174d76] font-bold' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          2. Overview & Scope
        </a>
        <a
          href="#context"
          onClick={(e) => scrollTo(e, 'context')}
          className={`block px-2.5 py-1.5 rounded transition-colors ${
            activeId === 'context' ? 'bg-[#eaf2f8] text-[#174d76] font-bold' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          3. Business Context
        </a>
        <a
          href="#roles"
          onClick={(e) => scrollTo(e, 'roles')}
          className={`block px-2.5 py-1.5 rounded transition-colors ${
            activeId === 'roles' ? 'bg-[#eaf2f8] text-[#174d76] font-bold' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          4. Actors & Assumptions
        </a>

        {/* Dynamic Modules Sections */}
        {visibleModules.map((mod: FsdModule) => (
          <div key={mod.id} className="pt-2">
            <a
              href={`#mod-${mod.code}`}
              onClick={(e) => scrollTo(e, `mod-${mod.code}`)}
              className={`block px-2.5 py-1 rounded font-semibold transition-colors ${
                activeId === `mod-${mod.code}`
                  ? 'bg-[#eaf2f8] text-[#174d76]'
                  : 'text-slate-800 hover:bg-slate-50'
              }`}
            >
              Modul: {mod.name}
            </a>

            <div className="pl-3 border-l border-slate-200 ml-2 space-y-0.5 mt-0.5">
              <a
                href={`#flows-${mod.code}`}
                onClick={(e) => scrollTo(e, `flows-${mod.code}`)}
                className={`block px-2 py-1 rounded text-[11px] transition-colors ${
                  activeId === `flows-${mod.code}`
                    ? 'bg-[#eaf2f8] text-[#174d76] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                5. Process Flows
              </a>
              <a
                href={`#ui-${mod.code}`}
                onClick={(e) => scrollTo(e, `ui-${mod.code}`)}
                className={`block px-2 py-1 rounded text-[11px] transition-colors ${
                  activeId === `ui-${mod.code}`
                    ? 'bg-[#eaf2f8] text-[#174d76] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                6. UI / Lo-Fi
              </a>
              <a
                href={`#req-${mod.code}`}
                onClick={(e) => scrollTo(e, `req-${mod.code}`)}
                className={`block px-2 py-1 rounded text-[11px] transition-colors ${
                  activeId === `req-${mod.code}`
                    ? 'bg-[#eaf2f8] text-[#174d76] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7. Requirements
              </a>
              <a
                href={`#rules-${mod.code}`}
                onClick={(e) => scrollTo(e, `rules-${mod.code}`)}
                className={`block px-2 py-1 rounded text-[11px] transition-colors ${
                  activeId === `rules-${mod.code}`
                    ? 'bg-[#eaf2f8] text-[#174d76] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                8. Business Rules
              </a>
              <a
                href={`#data-${mod.code}`}
                onClick={(e) => scrollTo(e, `data-${mod.code}`)}
                className={`block px-2 py-1 rounded text-[11px] transition-colors ${
                  activeId === `data-${mod.code}`
                    ? 'bg-[#eaf2f8] text-[#174d76] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                9. Data & Validation
              </a>
              <a
                href={`#int-${mod.code}`}
                onClick={(e) => scrollTo(e, `int-${mod.code}`)}
                className={`block px-2 py-1 rounded text-[11px] transition-colors ${
                  activeId === `int-${mod.code}`
                    ? 'bg-[#eaf2f8] text-[#174d76] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                10. Integrations
              </a>
              <a
                href={`#errors-${mod.code}`}
                onClick={(e) => scrollTo(e, `errors-${mod.code}`)}
                className={`block px-2 py-1 rounded text-[11px] transition-colors ${
                  activeId === `errors-${mod.code}`
                    ? 'bg-[#eaf2f8] text-[#174d76] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                11. Error Handling
              </a>
              <a
                href={`#nfr-${mod.code}`}
                onClick={(e) => scrollTo(e, `nfr-${mod.code}`)}
                className={`block px-2 py-1 rounded text-[11px] transition-colors ${
                  activeId === `nfr-${mod.code}`
                    ? 'bg-[#eaf2f8] text-[#174d76] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                12. Security & NFR
              </a>
              <a
                href={`#ac-${mod.code}`}
                onClick={(e) => scrollTo(e, `ac-${mod.code}`)}
                className={`block px-2 py-1 rounded text-[11px] transition-colors ${
                  activeId === `ac-${mod.code}`
                    ? 'bg-[#eaf2f8] text-[#174d76] font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                13. Acceptance Criteria
              </a>
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-slate-100">
          <a
            href="#traceability"
            onClick={(e) => scrollTo(e, 'traceability')}
            className={`block px-2.5 py-1.5 rounded transition-colors ${
              activeId === 'traceability' ? 'bg-[#eaf2f8] text-[#174d76] font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            14. Traceability Matrix
          </a>
          <a
            href="#open-items"
            onClick={(e) => scrollTo(e, 'open-items')}
            className={`block px-2.5 py-1.5 rounded transition-colors ${
              activeId === 'open-items' ? 'bg-[#eaf2f8] text-[#174d76] font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            15. Open Items & Approvals
          </a>
          <a
            href="#appendix"
            onClick={(e) => scrollTo(e, 'appendix')}
            className={`block px-2.5 py-1.5 rounded transition-colors ${
              activeId === 'appendix' ? 'bg-[#eaf2f8] text-[#174d76] font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Appendix A. API Handoff
          </a>
        </div>
      </nav>
    </aside>
  );
}

