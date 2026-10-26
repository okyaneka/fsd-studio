import { useState } from 'react';
import type { FsdDocument, FsdModule, ModuleSection } from '../../core/types';
import { ArrowLeftIcon } from '../../components/Icons';
import { FlowsSection } from './sections/FlowsSection';
import { ScreensSection } from './sections/ScreensSection';
import { RequirementsSection } from './sections/RequirementsSection';
import { BusinessRulesSection } from './sections/BusinessRulesSection';
import { ValidationsSection } from './sections/ValidationsSection';
import { IntegrationsSection } from './sections/IntegrationsSection';
import { ErrorStatesSection } from './sections/ErrorStatesSection';
import { NfrsSection } from './sections/NfrsSection';
import { AcceptanceCriteriaSection } from './sections/AcceptanceCriteriaSection';

interface ModuleAuthoringViewProps {
  fsd: FsdDocument;
  module: FsdModule;
  projectId: string;
  onUpdateModule: (updatedModule: FsdModule) => void;
  onBack: () => void;
}

const SECTION_KEYS: ModuleSection[] = [
  'flows',
  'screens',
  'requirements',
  'businessRules',
  'validations',
  'integrations',
  'errorStates',
  'nfrs',
  'acceptanceCriteria',
];

const SECTION_TITLES: Record<ModuleSection, string> = {
  flows: '1. Process Flows',
  screens: '2. UI & Lo-Fi Wireframes',
  requirements: '3. Functional Requirements',
  businessRules: '4. Business Rules',
  validations: '5. Data & Validation Rules',
  integrations: '6. Integration Requirements',
  errorStates: '7. Error Handling & UI States',
  nfrs: '8. Security & NFR',
  acceptanceCriteria: '9. Acceptance Criteria (GWT)',
};

export function ModuleAuthoringView({
  fsd,
  module,
  projectId,
  onUpdateModule,
  onBack,
}: ModuleAuthoringViewProps) {
  const [activeSection, setActiveSection] = useState<ModuleSection>('flows');

  return (
    <div className="space-y-6">
      {/* Top Module Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Kembali ke Daftar Modul FSD
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded">
              MOD-{module.code}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{module.name}</h2>
          </div>
          {module.description && (
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">{module.description}</p>
          )}
        </div>
      </div>

      {/* 9 Sections Layout (Horizontal Tabs on Top + Active Section Card) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/70 p-1.5 gap-1 scrollbar-thin">
          {SECTION_KEYS.map((key) => {
            const count = module[key]?.length ?? 0;
            const isCurrent = activeSection === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <span>{SECTION_TITLES[key]}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Section Content */}
        <div className="p-6">
          {activeSection === 'flows' && (
            <FlowsSection fsd={fsd} module={module} onUpdateModule={onUpdateModule} />
          )}
          {activeSection === 'screens' && (
            <ScreensSection
              fsd={fsd}
              module={module}
              projectId={projectId}
              onUpdateModule={onUpdateModule}
            />
          )}
          {activeSection === 'requirements' && (
            <RequirementsSection fsd={fsd} module={module} onUpdateModule={onUpdateModule} />
          )}
          {activeSection === 'businessRules' && (
            <BusinessRulesSection fsd={fsd} module={module} onUpdateModule={onUpdateModule} />
          )}
          {activeSection === 'validations' && (
            <ValidationsSection fsd={fsd} module={module} onUpdateModule={onUpdateModule} />
          )}
          {activeSection === 'integrations' && (
            <IntegrationsSection fsd={fsd} module={module} onUpdateModule={onUpdateModule} />
          )}
          {activeSection === 'errorStates' && (
            <ErrorStatesSection fsd={fsd} module={module} onUpdateModule={onUpdateModule} />
          )}
          {activeSection === 'nfrs' && (
            <NfrsSection fsd={fsd} module={module} onUpdateModule={onUpdateModule} />
          )}
          {activeSection === 'acceptanceCriteria' && (
            <AcceptanceCriteriaSection fsd={fsd} module={module} onUpdateModule={onUpdateModule} />
          )}
        </div>
      </div>
    </div>
  );
}
