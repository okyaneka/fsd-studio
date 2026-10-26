import { useState, useMemo } from 'react';
import type {
  FsdDocument,
  FsdModule,
  ModuleSection,
  SectionState,
  Flow,
  FlowStep,
  Screen,
  ScreenAnnotation,
  FunctionalRequirement,
  BusinessRule,
  ValidationRule,
  ValidationRuleItem,
  IntegrationRequirement,
  ErrorState,
  NonFunctionalRequirement,
  AcceptanceCriterion,
  GivenWhenThenScenario,
  RequirementStatus,
} from '../../core/types';
import { createArtifactId } from '../../core/schema';
import { REQUIREMENT_STATUSES } from '../../core/constants';
import { PlusIcon, TrashIcon, EditIcon, ArrowLeftIcon, XMarkIcon } from '../../components/Icons';
import { Modal } from '../../components/Modal';
import { WireframeAssetViewer } from './WireframeAssetViewer';
import { RelationalIdPicker } from './RelationalIdPicker';

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

  // Flow feature grouping & filter states (Process Flows only)
  const [selectedFlowFeatureFilter, setSelectedFlowFeatureFilter] = useState<string>('all');
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');

  // Collect all known features for flows in this module
  const allFeatures = useMemo(() => {
    const list = [...(module.features || [])];
    const set = new Set<string>(list);
    module.flows.forEach((f) => f.feature?.trim() && set.add(f.feature.trim()));
    return Array.from(set);
  }, [module.features, module.flows]);

  const displayedFlows = useMemo(() => {
    if (selectedFlowFeatureFilter === 'all') return module.flows;
    return module.flows.filter((f) => f.feature === selectedFlowFeatureFilter);
  }, [module.flows, selectedFlowFeatureFilter]);

  const handleAddNewFeature = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFeatureName.trim();
    if (!trimmed) return;
    if (!allFeatures.includes(trimmed)) {
      onUpdateModule({
        ...module,
        features: [...(module.features || []), trimmed],
      });
    }
    setNewFeatureName('');
    setIsAddFeatureModalOpen(false);
    setSelectedFlowFeatureFilter(trimmed);
    setFlowFeature(trimmed);
  };

  // Modal feature state (for Flow only)
  const [flowFeature, setFlowFeature] = useState('');

  // Modal states for each section
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [editingFlowIndex, setEditingFlowIndex] = useState<number | null>(null);
  const [flowName, setFlowName] = useState('');
  const [flowDesc, setFlowDesc] = useState('');
  const [flowNotes, setFlowNotes] = useState('');
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);

  // Screen modal
  const [screenModalOpen, setScreenModalOpen] = useState(false);
  const [editingScreenIndex, setEditingScreenIndex] = useState<number | null>(null);
  const [screenName, setScreenName] = useState('');
  const [screenDesc, setScreenDesc] = useState('');
  const [screenAssetId, setScreenAssetId] = useState<string | null>(null);
  const [screenCaption, setScreenCaption] = useState('');
  const [screenAlt, setScreenAlt] = useState('');
  const [screenOrientation, setScreenOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [screenAnnotations, setScreenAnnotations] = useState<ScreenAnnotation[]>([]);
  const [annotationInput, setAnnotationInput] = useState('');

  // Requirement modal
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [editingReqIndex, setEditingReqIndex] = useState<number | null>(null);
  const [reqName, setReqName] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqStatus, setReqStatus] = useState<RequirementStatus>('Draft');
  const [reqPriority, setReqPriority] = useState<FunctionalRequirement['priority']>('Must');
  const [reqFlowIds, setReqFlowIds] = useState<string[]>([]);
  const [reqScreenIds, setReqScreenIds] = useState<string[]>([]);
  const [reqAcIds, setReqAcIds] = useState<string[]>([]);

  // Business Rule modal
  const [brModalOpen, setBrModalOpen] = useState(false);
  const [editingBrIndex, setEditingBrIndex] = useState<number | null>(null);
  const [brName, setBrName] = useState('');
  const [brDesc, setBrDesc] = useState('');
  const [brRationale, setBrRationale] = useState('');
  const [brReqIds, setBrReqIds] = useState<string[]>([]);

  // Validation Rule modal
  const [valModalOpen, setValModalOpen] = useState(false);
  const [editingValIndex, setEditingValIndex] = useState<number | null>(null);
  const [valField, setValField] = useState('');
  const [valName, setValName] = useState('');
  const [valRules, setValRules] = useState<Array<{ rule: string; value: string; errorMessage: string }>>([
    { rule: '', value: '', errorMessage: '' },
  ]);
  const [valReqIds, setValReqIds] = useState<string[]>([]);

  // Integration modal
  const [intModalOpen, setIntModalOpen] = useState(false);
  const [editingIntIndex, setEditingIntIndex] = useState<number | null>(null);
  const [intName, setIntName] = useState('');
  const [intDesc, setIntDesc] = useState('');
  const [intOwner, setIntOwner] = useState('');
  const [intInput, setIntInput] = useState('');
  const [intOutcome, setIntOutcome] = useState('');
  const [intReqIds, setIntReqIds] = useState<string[]>([]);

  // Error State modal
  const [errModalOpen, setErrModalOpen] = useState(false);
  const [editingErrIndex, setEditingErrIndex] = useState<number | null>(null);
  const [errName, setErrName] = useState('');
  const [errDesc, setErrDesc] = useState('');
  const [errTrigger, setErrTrigger] = useState('');
  const [errUserMessage, setErrUserMessage] = useState('');
  const [errRecovery, setErrRecovery] = useState('');

  // NFR modal
  const [nfrModalOpen, setNfrModalOpen] = useState(false);
  const [editingNfrIndex, setEditingNfrIndex] = useState<number | null>(null);
  const [nfrName, setNfrName] = useState('');
  const [nfrCategory, setNfrCategory] = useState('Performance');
  const [nfrMeasure, setNfrMeasure] = useState('');
  const [nfrDesc, setNfrDesc] = useState('');

  // Acceptance Criteria modal (Given-When-Then)
  const [acModalOpen, setAcModalOpen] = useState(false);
  const [editingAcIndex, setEditingAcIndex] = useState<number | null>(null);
  const [acName, setAcName] = useState('');
  const [acDesc, setAcDesc] = useState('');
  const [acReqIds, setAcReqIds] = useState<string[]>([]);
  const [acScenarios, setAcScenarios] = useState<GivenWhenThenScenario[]>([
    { given: ['pengguna berada di halaman utama'], when: 'pengguna menekan tombol konfirmasi', then: ['sistem memproses permintaan'] },
  ]);

  const updateSectionState = (sec: ModuleSection, state: SectionState) => {
    onUpdateModule({
      ...module,
      sectionStates: {
        ...module.sectionStates,
        [sec]: state,
      },
    });
  };

  // 1. FLOW HANDLERS
  const handleOpenAddFlow = () => {
    setEditingFlowIndex(null);
    setFlowName('');
    setFlowDesc('');
    setFlowNotes('');
    setFlowFeature(selectedFlowFeatureFilter !== 'all' ? selectedFlowFeatureFilter : (allFeatures[0] || ''));
    setFlowSteps([
      { order: 1, actor: 'User', action: '', systemResponse: '', requirementIds: [] },
    ]);
    setFlowModalOpen(true);
  };

  const handleOpenEditFlow = (index: number) => {
    const f = module.flows[index];
    setEditingFlowIndex(index);
    setFlowName(f.name);
    setFlowDesc(f.description);
    setFlowNotes(f.notes || '');
    setFlowFeature(f.feature || '');
    setFlowSteps(f.steps.length ? f.steps : [{ order: 1, actor: 'User', action: '', systemResponse: '', requirementIds: [] }]);
    setFlowModalOpen(true);
  };

  const handleSaveFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowName.trim()) return;

    const seq = editingFlowIndex !== null ? editingFlowIndex + 1 : module.flows.length + 1;
    const generatedId =
      editingFlowIndex !== null
        ? module.flows[editingFlowIndex].id
        : createArtifactId('flow', module.code, seq, flowName.trim(), fsd.idConvention);

    const trimmedFeature = flowFeature.trim() || undefined;
    const currentFeatures = module.features || [];
    const nextFeatures =
      trimmedFeature && !currentFeatures.includes(trimmedFeature)
        ? [...currentFeatures, trimmedFeature]
        : currentFeatures;

    const newFlow: Flow = {
      id: generatedId,
      name: flowName.trim(),
      description: flowDesc.trim(),
      notes: flowNotes.trim(),
      steps: flowSteps,
      alternativePaths: [],
      feature: trimmedFeature,
    };

    const updated = [...module.flows];
    if (editingFlowIndex !== null) updated[editingFlowIndex] = newFlow;
    else updated.push(newFlow);

    onUpdateModule({
      ...module,
      features: nextFeatures,
      flows: updated,
      sectionStates: {
        ...module.sectionStates,
        flows: module.sectionStates.flows === 'empty' ? 'in-progress' : module.sectionStates.flows,
      },
    });
    setFlowModalOpen(false);
  };

  const handleDeleteFlow = (index: number) => {
    const updated = [...module.flows];
    updated.splice(index, 1);
    onUpdateModule({ ...module, flows: updated });
  };

  // 2. SCREEN HANDLERS
  const handleOpenAddScreen = () => {
    setEditingScreenIndex(null);
    setScreenName('');
    setScreenDesc('');
    setScreenAssetId(null);
    setScreenCaption('');
    setScreenAlt('');
    setScreenOrientation('auto');
    setScreenAnnotations([]);
    setAnnotationInput('');
    setScreenModalOpen(true);
  };

  const handleOpenEditScreen = (index: number) => {
    const s = module.screens[index];
    setEditingScreenIndex(index);
    setScreenName(s.name);
    setScreenDesc(s.description);
    setScreenAssetId(s.wireframeAssetId);
    setScreenCaption(s.imageCaption || '');
    setScreenAlt(s.imageAlt || '');
    setScreenOrientation(s.orientation);
    setScreenAnnotations(s.annotations || []);
    setAnnotationInput('');
    setScreenModalOpen(true);
  };

  const handleAddAnnotation = () => {
    if (!annotationInput.trim()) return;
    const nextNum = screenAnnotations.length + 1;
    setScreenAnnotations([
      ...screenAnnotations,
      { number: nextNum, text: annotationInput.trim(), requirementIds: [], validationIds: [] },
    ]);
    setAnnotationInput('');
  };

  const handleRemoveAnnotation = (idx: number) => {
    const updated = [...screenAnnotations];
    updated.splice(idx, 1);
    // Renumber
    updated.forEach((a, i) => (a.number = i + 1));
    setScreenAnnotations(updated);
  };

  const handleSaveScreen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenName.trim()) return;

    const seq = editingScreenIndex !== null ? editingScreenIndex + 1 : module.screens.length + 1;
    const generatedId =
      editingScreenIndex !== null
        ? module.screens[editingScreenIndex].id
        : createArtifactId('screen', module.code, seq, screenName.trim(), fsd.idConvention);

    const newScreen: Screen = {
      id: generatedId,
      name: screenName.trim(),
      description: screenDesc.trim(),
      wireframeAssetId: screenAssetId,
      imageCaption: screenCaption.trim(),
      imageAlt: screenAlt.trim(),
      orientation: screenOrientation,
      annotations: screenAnnotations,
    };

    const updated = [...module.screens];
    if (editingScreenIndex !== null) updated[editingScreenIndex] = newScreen;
    else updated.push(newScreen);

    onUpdateModule({
      ...module,
      screens: updated,
      sectionStates: {
        ...module.sectionStates,
        screens: module.sectionStates.screens === 'empty' ? 'in-progress' : module.sectionStates.screens,
      },
    });
    setScreenModalOpen(false);
  };

  const handleDeleteScreen = (index: number) => {
    const updated = [...module.screens];
    updated.splice(index, 1);
    onUpdateModule({ ...module, screens: updated });
  };

  // 3. REQUIREMENT HANDLERS
  const handleOpenAddReq = () => {
    setEditingReqIndex(null);
    setReqName('');
    setReqDesc('');
    setReqStatus('Draft');
    setReqPriority('Must');
    setReqFlowIds([]);
    setReqScreenIds([]);
    setReqAcIds([]);
    setReqModalOpen(true);
  };

  const handleOpenEditReq = (index: number) => {
    const r = module.requirements[index];
    setEditingReqIndex(index);
    setReqName(r.name);
    setReqDesc(r.description);
    setReqStatus(r.status);
    setReqPriority(r.priority);
    setReqFlowIds(r.flowIds || []);
    setReqScreenIds(r.screenIds || []);
    setReqAcIds(r.acceptanceCriteriaIds || []);
    setReqModalOpen(true);
  };

  const handleSaveReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim()) return;

    const seq = editingReqIndex !== null ? editingReqIndex + 1 : module.requirements.length + 1;
    const generatedId =
      editingReqIndex !== null
        ? module.requirements[editingReqIndex].id
        : createArtifactId('requirement', module.code, seq, undefined, fsd.idConvention);

    const newReq: FunctionalRequirement = {
      id: generatedId,
      name: reqName.trim(),
      description: reqDesc.trim(),
      status: reqStatus,
      priority: reqPriority,
      flowIds: reqFlowIds,
      screenIds: reqScreenIds,
      acceptanceCriteriaIds: reqAcIds,
    };

    const updatedReqs = [...module.requirements];
    if (editingReqIndex !== null) updatedReqs[editingReqIndex] = newReq;
    else updatedReqs.push(newReq);

    // Sinkronkan dua arah ke Acceptance Criteria
    const updatedAc = module.acceptanceCriteria.map((ac) => {
      const isSelected = reqAcIds.includes(ac.id);
      const hasReqId = ac.requirementIds?.includes(generatedId);
      if (isSelected && !hasReqId) {
        return { ...ac, requirementIds: [...(ac.requirementIds || []), generatedId] };
      }
      if (!isSelected && hasReqId) {
        return { ...ac, requirementIds: (ac.requirementIds || []).filter((id) => id !== generatedId) };
      }
      return ac;
    });

    onUpdateModule({
      ...module,
      requirements: updatedReqs,
      acceptanceCriteria: updatedAc,
      sectionStates: {
        ...module.sectionStates,
        requirements: module.sectionStates.requirements === 'empty' ? 'in-progress' : module.sectionStates.requirements,
      },
    });
    setReqModalOpen(false);
  };

  const handleDeleteReq = (index: number) => {
    const updated = [...module.requirements];
    updated.splice(index, 1);
    onUpdateModule({ ...module, requirements: updated });
  };

  // 4. BUSINESS RULE HANDLERS
  const handleOpenAddBr = () => {
    setEditingBrIndex(null);
    setBrName('');
    setBrDesc('');
    setBrRationale('');
    setBrReqIds([]);
    setBrModalOpen(true);
  };

  const handleOpenEditBr = (index: number) => {
    const br = module.businessRules[index];
    setEditingBrIndex(index);
    setBrName(br.name);
    setBrDesc(br.description);
    setBrRationale(br.rationale || '');
    setBrReqIds(br.relatedRequirementIds || []);
    setBrModalOpen(true);
  };

  const handleSaveBr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brName.trim()) return;

    const seq = editingBrIndex !== null ? editingBrIndex + 1 : module.businessRules.length + 1;
    const generatedId =
      editingBrIndex !== null
        ? module.businessRules[editingBrIndex].id
        : createArtifactId('businessRule', module.code, seq, undefined, fsd.idConvention);

    const newBr: BusinessRule = {
      id: generatedId,
      name: brName.trim(),
      description: brDesc.trim(),
      rationale: brRationale.trim(),
      relatedRequirementIds: brReqIds,
    };

    const updated = [...module.businessRules];
    if (editingBrIndex !== null) updated[editingBrIndex] = newBr;
    else updated.push(newBr);

    onUpdateModule({
      ...module,
      businessRules: updated,
      sectionStates: {
        ...module.sectionStates,
        businessRules: module.sectionStates.businessRules === 'empty' ? 'in-progress' : module.sectionStates.businessRules,
      },
    });
    setBrModalOpen(false);
  };

  const handleDeleteBr = (index: number) => {
    const updated = [...module.businessRules];
    updated.splice(index, 1);
    onUpdateModule({ ...module, businessRules: updated });
  };

  // 5. VALIDATION RULE HANDLERS
  const handleOpenAddVal = () => {
    setEditingValIndex(null);
    setValField('');
    setValName('');
    setValRules([{ rule: '', value: '', errorMessage: '' }]);
    setValReqIds([]);
    setValModalOpen(true);
  };

  const handleOpenEditVal = (index: number) => {
    const v = module.validations[index];
    setEditingValIndex(index);
    setValField(v.field);
    setValName(v.name);
    if (v.rules && v.rules.length > 0) {
      setValRules(
        v.rules.map((r) => ({
          rule: r.rule || '',
          value: r.value || '',
          errorMessage: r.errorMessage || (r as unknown as { error_message?: string }).error_message || '',
        }))
      );
    } else {
      setValRules([
        { rule: v.condition || '', value: '', errorMessage: v.message || '' },
      ]);
    }
    setValReqIds(v.relatedRequirementIds || []);
    setValModalOpen(true);
  };

  const handleAddValRuleRow = () => {
    setValRules((prev) => [...prev, { rule: '', value: '', errorMessage: '' }]);
  };

  const handleRemoveValRuleRow = (rIndex: number) => {
    setValRules((prev) => {
      const updated = prev.filter((_, idx) => idx !== rIndex);
      return updated.length > 0 ? updated : [{ rule: '', value: '', errorMessage: '' }];
    });
  };

  const handleValRuleChange = (
    rIndex: number,
    field: 'rule' | 'value' | 'errorMessage',
    val: string
  ) => {
    setValRules((prev) => {
      const updated = [...prev];
      updated[rIndex] = { ...updated[rIndex], [field]: val };
      return updated;
    });
  };

  const handleSaveVal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valField.trim()) return;

    const cleanedRules: ValidationRuleItem[] = valRules
      .map((r) => ({
        rule: r.rule.trim(),
        value: r.value.trim() ? r.value.trim() : undefined,
        errorMessage: r.errorMessage.trim(),
      }))
      .filter((r) => r.rule || r.errorMessage);

    if (cleanedRules.length === 0) return;

    const seq = editingValIndex !== null ? editingValIndex + 1 : module.validations.length + 1;
    const generatedId =
      editingValIndex !== null
        ? module.validations[editingValIndex].id
        : createArtifactId('validation', module.code, seq, valField.trim(), fsd.idConvention);

    const derivedCondition = cleanedRules
      .map((r) => `${r.rule}${r.value ? ` (${r.value})` : ''}`)
      .join(', ');
    const derivedMessage = cleanedRules
      .map((r) => r.errorMessage)
      .filter(Boolean)
      .join(' | ');

    const newVal: ValidationRule = {
      id: generatedId,
      field: valField.trim(),
      name: valName.trim() || `Validasi ${valField.trim()}`,
      description: '',
      condition: derivedCondition,
      message: derivedMessage,
      rules: cleanedRules,
      relatedRequirementIds: valReqIds,
    };

    const updated = [...module.validations];
    if (editingValIndex !== null) updated[editingValIndex] = newVal;
    else updated.push(newVal);

    onUpdateModule({
      ...module,
      validations: updated,
      sectionStates: {
        ...module.sectionStates,
        validations: module.sectionStates.validations === 'empty' ? 'in-progress' : module.sectionStates.validations,
      },
    });
    setValModalOpen(false);
  };

  const handleDeleteVal = (index: number) => {
    const updated = [...module.validations];
    updated.splice(index, 1);
    onUpdateModule({ ...module, validations: updated });
  };

  // 6. INTEGRATION HANDLERS
  const handleOpenAddInt = () => {
    setEditingIntIndex(null);
    setIntName('');
    setIntDesc('');
    setIntOwner('');
    setIntInput('');
    setIntOutcome('');
    setIntReqIds([]);
    setIntModalOpen(true);
  };

  const handleOpenEditInt = (index: number) => {
    const it = module.integrations[index];
    setEditingIntIndex(index);
    setIntName(it.name);
    setIntDesc(it.description);
    setIntOwner(it.owner);
    setIntInput(it.input);
    setIntOutcome(it.outcome);
    setIntReqIds(it.relatedRequirementIds || []);
    setIntModalOpen(true);
  };

  const handleSaveInt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intName.trim()) return;

    const seq = editingIntIndex !== null ? editingIntIndex + 1 : module.integrations.length + 1;
    const generatedId =
      editingIntIndex !== null
        ? module.integrations[editingIntIndex].id
        : createArtifactId('integration', module.code, seq, intName.trim(), fsd.idConvention);

    const newInt: IntegrationRequirement = {
      id: generatedId,
      name: intName.trim(),
      description: intDesc.trim(),
      owner: intOwner.trim(),
      input: intInput.trim(),
      outcome: intOutcome.trim(),
      relatedRequirementIds: intReqIds,
    };

    const updated = [...module.integrations];
    if (editingIntIndex !== null) updated[editingIntIndex] = newInt;
    else updated.push(newInt);

    onUpdateModule({
      ...module,
      integrations: updated,
      sectionStates: {
        ...module.sectionStates,
        integrations: module.sectionStates.integrations === 'empty' ? 'in-progress' : module.sectionStates.integrations,
      },
    });
    setIntModalOpen(false);
  };

  const handleDeleteInt = (index: number) => {
    const updated = [...module.integrations];
    updated.splice(index, 1);
    onUpdateModule({ ...module, integrations: updated });
  };

  // 7. ERROR STATE HANDLERS
  const handleOpenAddErr = () => {
    setEditingErrIndex(null);
    setErrName('');
    setErrDesc('');
    setErrTrigger('');
    setErrUserMessage('');
    setErrRecovery('');
    setErrModalOpen(true);
  };

  const handleOpenEditErr = (index: number) => {
    const err = module.errorStates[index];
    setEditingErrIndex(index);
    setErrName(err.name);
    setErrDesc(err.description);
    setErrTrigger(err.trigger);
    setErrUserMessage(err.userMessage);
    setErrRecovery(err.recovery);
    setErrModalOpen(true);
  };

  const handleSaveErr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!errName.trim()) return;

    const seq = editingErrIndex !== null ? editingErrIndex + 1 : module.errorStates.length + 1;
    const prefix = fsd.idConvention.prefix ? `${fsd.idConvention.prefix}-` : '';
    const generatedId =
      editingErrIndex !== null
        ? module.errorStates[editingErrIndex].id
        : `ERR-${prefix}${module.code}-${String(seq).padStart(2, '0')}`;

    const newErr: ErrorState = {
      id: generatedId,
      name: errName.trim(),
      description: errDesc.trim(),
      trigger: errTrigger.trim(),
      userMessage: errUserMessage.trim(),
      recovery: errRecovery.trim(),
      relatedRequirementIds: [],
    };

    const updated = [...module.errorStates];
    if (editingErrIndex !== null) updated[editingErrIndex] = newErr;
    else updated.push(newErr);

    onUpdateModule({
      ...module,
      errorStates: updated,
      sectionStates: {
        ...module.sectionStates,
        errorStates: module.sectionStates.errorStates === 'empty' ? 'in-progress' : module.sectionStates.errorStates,
      },
    });
    setErrModalOpen(false);
  };

  const handleDeleteErr = (index: number) => {
    const updated = [...module.errorStates];
    updated.splice(index, 1);
    onUpdateModule({ ...module, errorStates: updated });
  };

  // 8. SECURITY & NFR HANDLERS
  const handleOpenAddNfr = () => {
    setEditingNfrIndex(null);
    setNfrName('');
    setNfrCategory('Security');
    setNfrMeasure('');
    setNfrDesc('');
    setNfrModalOpen(true);
  };

  const handleOpenEditNfr = (index: number) => {
    const n = module.nfrs[index];
    setEditingNfrIndex(index);
    setNfrName(n.name);
    setNfrCategory(n.category);
    setNfrMeasure(n.measure);
    setNfrDesc(n.description);
    setNfrModalOpen(true);
  };

  const handleSaveNfr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nfrName.trim() || !nfrMeasure.trim()) return;

    const seq = editingNfrIndex !== null ? editingNfrIndex + 1 : module.nfrs.length + 1;
    const prefix = fsd.idConvention.prefix ? `${fsd.idConvention.prefix}-` : '';
    const generatedId =
      editingNfrIndex !== null
        ? module.nfrs[editingNfrIndex].id
        : `NFR-${prefix}${module.code}-${String(seq).padStart(2, '0')}`;

    const newNfr: NonFunctionalRequirement = {
      id: generatedId,
      name: nfrName.trim(),
      category: nfrCategory.trim(),
      measure: nfrMeasure.trim(),
      description: nfrDesc.trim(),
    };

    const updated = [...module.nfrs];
    if (editingNfrIndex !== null) updated[editingNfrIndex] = newNfr;
    else updated.push(newNfr);

    onUpdateModule({
      ...module,
      nfrs: updated,
      sectionStates: {
        ...module.sectionStates,
        nfrs: module.sectionStates.nfrs === 'empty' ? 'in-progress' : module.sectionStates.nfrs,
      },
    });
    setNfrModalOpen(false);
  };

  const handleDeleteNfr = (index: number) => {
    const updated = [...module.nfrs];
    updated.splice(index, 1);
    onUpdateModule({ ...module, nfrs: updated });
  };

  // 9. ACCEPTANCE CRITERIA HANDLERS (Given-When-Then)
  const handleOpenAddAc = () => {
    setEditingAcIndex(null);
    setAcName('');
    setAcDesc('');
    setAcReqIds([]);
    setAcScenarios([
      {
        title: 'Happy Path - Berhasil',
        given: ['pengguna berada pada halaman utama yang valid'],
        when: 'pengguna menekan tombol konfirmasi transaksi',
        then: ['sistem memvalidasi parameter input', 'sistem menampilkan pesan sukses'],
      },
    ]);
    setAcModalOpen(true);
  };

  const handleOpenEditAc = (index: number) => {
    const ac = module.acceptanceCriteria[index];
    setEditingAcIndex(index);
    setAcName(ac.name);
    setAcDesc(ac.description);
    setAcReqIds(ac.requirementIds || []);
    setAcScenarios(
      ac.scenarios && ac.scenarios.length > 0
        ? ac.scenarios.map((s) => ({ ...s, title: s.title || '' }))
        : [{ title: '', given: [''], when: '', then: [''] }]
    );
    setAcModalOpen(true);
  };

  const handleSaveAc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acName.trim()) return;

    const seq = editingAcIndex !== null ? editingAcIndex + 1 : module.acceptanceCriteria.length + 1;
    const generatedId =
      editingAcIndex !== null
        ? module.acceptanceCriteria[editingAcIndex].id
        : createArtifactId('acceptanceCriterion', module.code, seq, undefined, fsd.idConvention);

    const newAc: AcceptanceCriterion = {
      id: generatedId,
      name: acName.trim(),
      description: acDesc.trim(),
      requirementIds: acReqIds,
      scenarios: acScenarios,
    };

    const updatedAc = [...module.acceptanceCriteria];
    if (editingAcIndex !== null) updatedAc[editingAcIndex] = newAc;
    else updatedAc.push(newAc);

    // Sinkronkan dua arah ke requirements
    const updatedReqs = module.requirements.map((req) => {
      const isSelected = acReqIds.includes(req.id);
      const hasAcId = req.acceptanceCriteriaIds?.includes(generatedId);
      if (isSelected && !hasAcId) {
        return { ...req, acceptanceCriteriaIds: [...(req.acceptanceCriteriaIds || []), generatedId] };
      }
      if (!isSelected && hasAcId) {
        return {
          ...req,
          acceptanceCriteriaIds: (req.acceptanceCriteriaIds || []).filter((id) => id !== generatedId),
        };
      }
      return req;
    });

    onUpdateModule({
      ...module,
      acceptanceCriteria: updatedAc,
      requirements: updatedReqs,
      sectionStates: {
        ...module.sectionStates,
        acceptanceCriteria:
          module.sectionStates.acceptanceCriteria === 'empty' ? 'in-progress' : module.sectionStates.acceptanceCriteria,
      },
    });
    setAcModalOpen(false);
  };

  const handleDeleteAc = (index: number) => {
    const updated = [...module.acceptanceCriteria];
    updated.splice(index, 1);
    onUpdateModule({ ...module, acceptanceCriteria: updated });
  };

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
        <div className="p-6 space-y-6">
          {/* Sub-section Header & Status Controller */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{SECTION_TITLES[activeSection]}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bagian wajib standar spesifikasi fungsional FSD.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">Status Subbagian:</span>
                <select
                  value={module.sectionStates[activeSection]}
                  onChange={(e) => updateSectionState(activeSection, e.target.value as SectionState)}
                  className="px-2.5 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="empty">Kosong (Empty)</option>
                  <option value="in-progress">In-Progress</option>
                  <option value="complete">Selesai (Complete)</option>
                  <option value="tbd">TBD (To Be Decided)</option>
                  <option value="not-applicable">Not Applicable (N/A)</option>
                </select>
              </div>

              {/* Add item button */}
              {activeSection === 'flows' && (
                <button
                  type="button"
                  onClick={handleOpenAddFlow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Tambah Flow
                </button>
              )}
              {activeSection === 'screens' && (
                <button
                  type="button"
                  onClick={handleOpenAddScreen}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Tambah Layar / Wireframe
                </button>
              )}
              {activeSection === 'requirements' && (
                <button
                  type="button"
                  onClick={handleOpenAddReq}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Tambah Requirement
                </button>
              )}
              {activeSection === 'businessRules' && (
                <button
                  type="button"
                  onClick={handleOpenAddBr}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Tambah Aturan Bisnis
                </button>
              )}
              {activeSection === 'validations' && (
                <button
                  type="button"
                  onClick={handleOpenAddVal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Tambah Validasi
                </button>
              )}
              {activeSection === 'integrations' && (
                <button
                  type="button"
                  onClick={handleOpenAddInt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Tambah Integrasi
                </button>
              )}
              {activeSection === 'errorStates' && (
                <button
                  type="button"
                  onClick={handleOpenAddErr}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Tambah Error State
                </button>
              )}
              {activeSection === 'nfrs' && (
                <button
                  type="button"
                  onClick={handleOpenAddNfr}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Tambah NFR
                </button>
              )}
              {activeSection === 'acceptanceCriteria' && (
                <button
                  type="button"
                  onClick={handleOpenAddAc}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Tambah Kriteria (GWT)
                </button>
              )}
            </div>
          </div>

          {/* Explicit N/A or TBD Notice */}
          {module.sectionStates[activeSection] === 'not-applicable' && (
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
              Bagian ini ditandai sebagai <strong>Not Applicable (N/A)</strong> untuk modul ini. Pada dokumen cetak, bagian ini akan tetap dirender secara eksplisit dengan keterangan Not Applicable sesuai standar FSD.
            </div>
          )}
          {module.sectionStates[activeSection] === 'tbd' && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Bagian ini ditandai sebagai <strong>TBD (To Be Decided)</strong>. Tim masih menunggu klarifikasi atau keputusan teknis/bisnis sebelum melengkapi bagian ini.
            </div>
          )}

          {/* SECTION 1: FLOWS */}
          {activeSection === 'flows' && (
            <div className="space-y-4">
              {/* Feature Filter Bar khusus untuk Alur Proses */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
                  <span className="text-xs font-bold text-slate-700 whitespace-nowrap mr-1">
                    Kategori Fitur:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFlowFeatureFilter('all')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      selectedFlowFeatureFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Semua Alur ({module.flows.length})
                  </button>
                  {allFeatures.map((feat) => (
                    <button
                      key={feat}
                      type="button"
                      onClick={() => setSelectedFlowFeatureFilter(feat)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        selectedFlowFeatureFilter === feat
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {feat}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddFeatureModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Tambah Kategori Fitur</span>
                </button>
              </div>

              {displayedFlows.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 italic text-center">
                  Belum ada alur proses {selectedFlowFeatureFilter !== 'all' ? `untuk fitur "${selectedFlowFeatureFilter}"` : ''} yang didefinisikan.
                </p>
              ) : (
                <div className="space-y-4">
                  {displayedFlows.map((flow) => {
                    const actualIdx = module.flows.findIndex((f) => f.id === flow.id);
                    return (
                      <div key={flow.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                {flow.id}
                              </span>
                              {flow.feature && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                                  Fitur: {flow.feature}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{flow.name}</h4>
                            {flow.description && <p className="text-xs text-slate-600 mt-0.5">{flow.description}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditFlow(actualIdx)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                              title="Edit Flow"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFlow(actualIdx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              title="Hapus Flow"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Steps table */}
                        {flow.steps && flow.steps.length > 0 && (
                          <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                                  <th className="py-2 px-3 font-semibold w-16">Step</th>
                                  <th className="py-2 px-3 font-semibold w-32">Aktor</th>
                                  <th className="py-2 px-3 font-semibold">Aksi Pengguna</th>
                                  <th className="py-2 px-3 font-semibold">Respon Sistem</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {flow.steps.map((st, sIdx) => (
                                  <tr key={sIdx}>
                                    <td className="py-2 px-3 font-mono font-bold text-slate-500">{st.order}</td>
                                    <td className="py-2 px-3 font-medium text-slate-900">{st.actor}</td>
                                    <td className="py-2 px-3">{st.action}</td>
                                    <td className="py-2 px-3">{st.systemResponse}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {flow.notes && (
                          <div className="text-[11px] text-slate-500 italic bg-white p-2.5 rounded border border-slate-200">
                            Catatan: {flow.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: SCREENS */}
          {activeSection === 'screens' && (
            <div className="space-y-4">
              {module.screens.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 italic text-center">
                  Belum ada wireframe layar yang didaftarkan.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {module.screens.map((screen, sIdx) => {
                    return (
                      <div key={screen.id} className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {screen.id}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{screen.name}</h4>
                            {screen.description && <p className="text-xs text-slate-500 mt-0.5">{screen.description}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditScreen(sIdx)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                              title="Edit Layar"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteScreen(sIdx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              title="Hapus Layar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Screen Wireframe Asset View */}
                        <WireframeAssetViewer
                          assetId={screen.wireframeAssetId}
                          projectId={projectId}
                          fsdId={fsd.id}
                          moduleId={module.id}
                          screenId={screen.id}
                          onAssetChanged={(newAssetId) => {
                            const updatedScreens = [...module.screens];
                            updatedScreens[sIdx] = {
                              ...updatedScreens[sIdx],
                              wireframeAssetId: newAssetId,
                            };
                            onUpdateModule({ ...module, screens: updatedScreens });
                          }}
                        />

                      {screen.imageCaption && (
                        <p className="text-xs text-slate-600 italic text-center">Caption: "{screen.imageCaption}"</p>
                      )}

                      {/* Annotations */}
                      {screen.annotations && screen.annotations.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Anotasi Layar ({screen.annotations.length}):
                          </div>
                          <ul className="space-y-1">
                            {screen.annotations.map((ann, aIdx) => (
                              <li key={aIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                  {ann.number}
                                </span>
                                <span>{ann.text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: FUNCTIONAL REQUIREMENTS */}
          {activeSection === 'requirements' && (
            <div className="space-y-4">
              {module.requirements.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 italic text-center">
                  Belum ada Functional Requirement yang didefinisikan.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold w-32">Req ID</th>
                        <th className="py-2.5 px-3 font-semibold w-56">Kebutuhan Fungsional</th>
                        <th className="py-2.5 px-3 font-semibold">Deskripsi & Perilaku Sistem</th>
                        <th className="py-2.5 px-3 font-semibold w-24">Prioritas</th>
                        <th className="py-2.5 px-3 font-semibold w-28">Status</th>
                        <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {module.requirements.map((req, rIdx) => {
                        return (
                          <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{req.id}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">{req.name}</div>
                            </td>
                            <td className="py-2.5 px-3 leading-relaxed whitespace-break-spaces">{req.description || '—'}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                req.priority === 'Must'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : req.priority === 'Should'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {req.priority}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                {req.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditReq(rIdx)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                  title="Edit Requirement"
                                >
                                  <EditIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReq(rIdx)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                  title="Hapus Requirement"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: BUSINESS RULES */}
          {activeSection === 'businessRules' && (
            <div className="space-y-4">
              {module.businessRules.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 italic text-center">Belum ada Business Rule.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold w-28">Rule ID</th>
                        <th className="py-2.5 px-3 font-semibold w-48">Nama Aturan Bisnis</th>
                        <th className="py-2.5 px-3 font-semibold">Deskripsi Aturan</th>
                        <th className="py-2.5 px-3 font-semibold w-64">Rasional Bisnis</th>
                        <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {module.businessRules.map((br, idx) => (
                        <tr key={br.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{br.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{br.name}</td>
                          <td className="py-2.5 px-3 leading-relaxed">{br.description || '—'}</td>
                          <td className="py-2.5 px-3 text-slate-600">{br.rationale || '—'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button type="button" onClick={() => handleOpenEditBr(idx)} className="p-1 text-slate-400 hover:text-slate-700 rounded">
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => handleDeleteBr(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded">
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
          )}

          {/* SECTION 5: VALIDATIONS */}
          {activeSection === 'validations' && (
            <div className="space-y-4">
              {module.validations.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 italic text-center">Belum ada aturan validasi data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold w-32">Validation ID</th>
                        <th className="py-2.5 px-3 font-semibold w-40">Nama Field</th>
                        <th className="py-2.5 px-3 font-semibold">Kondisi / Aturan Validasi</th>
                        <th className="py-2.5 px-3 font-semibold w-64">Pesan Error ke Pengguna</th>
                        <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {module.validations.map((val, idx) => (
                        <tr key={val.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{val.id}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{val.field}</td>
                          <td className="py-2.5 px-3 leading-relaxed">
                            {val.rules && val.rules.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {val.rules.map((r, i) => (
                                  <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200">
                                    <span className="font-semibold text-slate-800">{r.rule}</span>
                                    {r.value && <span className="text-slate-500 ml-1">({r.value})</span>}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              val.condition
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-red-600 font-mono text-[11px]">
                            {val.rules && val.rules.length > 0 ? (
                              <div className="space-y-0.5">
                                {val.rules.map((r, i) => (
                                  <div key={i}>{r.errorMessage || '—'}</div>
                                ))}
                              </div>
                            ) : (
                              val.message
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button type="button" onClick={() => handleOpenEditVal(idx)} className="p-1 text-slate-400 hover:text-slate-700 rounded">
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => handleDeleteVal(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded">
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
          )}

          {/* SECTION 6: INTEGRATIONS */}
          {activeSection === 'integrations' && (
            <div className="space-y-4">
              {module.integrations.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 italic text-center">Belum ada integrasi sistem eksternal.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold w-32">Integration ID</th>
                        <th className="py-2.5 px-3 font-semibold w-48">Nama Integrasi</th>
                        <th className="py-2.5 px-3 font-semibold w-36">Owner / Service</th>
                        <th className="py-2.5 px-3 font-semibold">Input / Payload</th>
                        <th className="py-2.5 px-3 font-semibold">Outcome / Respon</th>
                        <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {module.integrations.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-cyan-700">{it.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{it.name}</td>
                          <td className="py-2.5 px-3">{it.owner || '—'}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{it.input || '—'}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{it.outcome || '—'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button type="button" onClick={() => handleOpenEditInt(idx)} className="p-1 text-slate-400 hover:text-slate-700 rounded">
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => handleDeleteInt(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded">
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
          )}

          {/* SECTION 7: ERROR STATES */}
          {activeSection === 'errorStates' && (
            <div className="space-y-4">
              {module.errorStates.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 italic text-center">Belum ada kondisi error state yang didefinisikan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold w-32">Error ID</th>
                        <th className="py-2.5 px-3 font-semibold w-44">Nama Kondisi Error</th>
                        <th className="py-2.5 px-3 font-semibold">Pemicu (Trigger)</th>
                        <th className="py-2.5 px-3 font-semibold w-64">Pesan Layar (User Message)</th>
                        <th className="py-2.5 px-3 font-semibold w-64">Tindakan Pemulihan (Recovery)</th>
                        <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {module.errorStates.map((err, idx) => (
                        <tr key={err.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-rose-700">{err.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{err.name}</td>
                          <td className="py-2.5 px-3 leading-relaxed">{err.trigger || '—'}</td>
                          <td className="py-2.5 px-3 text-rose-600 font-medium">{err.userMessage || '—'}</td>
                          <td className="py-2.5 px-3">{err.recovery || '—'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button type="button" onClick={() => handleOpenEditErr(idx)} className="p-1 text-slate-400 hover:text-slate-700 rounded">
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => handleDeleteErr(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded">
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
          )}

          {/* SECTION 8: NFR */}
          {activeSection === 'nfrs' && (
            <div className="space-y-4">
              {module.nfrs.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 italic text-center">Belum ada Non-Functional Requirement.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold w-32">NFR ID</th>
                        <th className="py-2.5 px-3 font-semibold w-40">Kategori</th>
                        <th className="py-2.5 px-3 font-semibold w-48">Kebutuhan NFR</th>
                        <th className="py-2.5 px-3 font-semibold">Ukuran / Metrik Target</th>
                        <th className="py-2.5 px-3 font-semibold w-20 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {module.nfrs.map((nfr, idx) => (
                        <tr key={nfr.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-teal-700">{nfr.id}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{nfr.category}</td>
                          <td className="py-2.5 px-3">{nfr.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-800">{nfr.measure}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button type="button" onClick={() => handleOpenEditNfr(idx)} className="p-1 text-slate-400 hover:text-slate-700 rounded">
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => handleDeleteNfr(idx)} className="p-1 text-slate-400 hover:text-red-600 rounded">
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
          )}

          {/* SECTION 9: ACCEPTANCE CRITERIA (Given-When-Then) */}
          {activeSection === 'acceptanceCriteria' && (
            <div className="space-y-4">
              {module.acceptanceCriteria.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 italic text-center">
                  Belum ada Acceptance Criteria yang didefinisikan.
                </p>
              ) : (
                <div className="space-y-4">
                  {module.acceptanceCriteria.map((ac, acIdx) => {
                    return (
                      <div key={ac.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {ac.id}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{ac.name}</h4>
                            {ac.description && <p className="text-xs text-slate-500 mt-0.5">{ac.description}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAc(acIdx)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                              title="Edit Acceptance Criteria"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAc(acIdx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              title="Hapus Acceptance Criteria"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Scenarios (Given-When-Then) */}
                        {ac.scenarios && ac.scenarios.length > 0 && (
                          <div className="space-y-3">
                            {ac.scenarios.map((sc, sIdx) => (
                              <div key={sIdx} className="bg-white rounded-lg p-3.5 border border-slate-200 text-xs space-y-2">
                                <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
                                  <span>
                                    {sc.title ? `Skenario #${sIdx + 1}: ${sc.title}` : `Skenario #${sIdx + 1}`}
                                  </span>
                                </div>
                                <div className="space-y-1 font-mono text-[11px]">
                                  {sc.given.map((g, gIdx) => (
                                    <div key={gIdx} className="text-slate-700">
                                      <strong className="text-blue-700">{gIdx === 0 ? 'GIVEN' : 'AND'}</strong> {g}
                                    </div>
                                  ))}
                                  <div className="text-slate-700">
                                    <strong className="text-amber-700">WHEN</strong> {sc.when}
                                  </div>
                                  {sc.then.map((t, tIdx) => (
                                    <div key={tIdx} className="text-slate-700">
                                      <strong className="text-emerald-700">{tIdx === 0 ? 'THEN' : 'AND'}</strong> {t}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- ALL MODALS FOR 9 SECTIONS --- */}

      {/* Modal 1: Flow */}
      <Modal isOpen={flowModalOpen} onClose={() => setFlowModalOpen(false)} title="Process Flow" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveFlow} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Alur Proses <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Login Pengguna Biasa"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kategori / Fitur Alur
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddFeatureModalOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  + Kategori Baru
                </button>
              </div>
              <select
                value={flowFeature}
                onChange={(e) => setFlowFeature(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Tanpa Kategori (Umum)</option>
                {allFeatures.map((feat) => (
                  <option key={feat} value={feat}>
                    {feat}
                  </option>
                ))}
                {flowFeature && !allFeatures.includes(flowFeature) && (
                  <option value={flowFeature}>{flowFeature}</option>
                )}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
            <input
              type="text"
              placeholder="Penjelasan singkat alur proses bisnis"
              value={flowDesc}
              onChange={(e) => setFlowDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Langkah Alur (Steps)</label>
              <button
                type="button"
                onClick={() =>
                  setFlowSteps([
                    ...flowSteps,
                    { order: flowSteps.length + 1, actor: 'User', action: '', systemResponse: '', requirementIds: [] },
                  ])
                }
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                + Tambah Langkah
              </button>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto p-1">
              {flowSteps.map((st, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-slate-500 w-5 text-center">{st.order}</span>
                  <input
                    type="text"
                    placeholder="Aktor"
                    value={st.actor}
                    onChange={(e) => {
                      const updated = [...flowSteps];
                      updated[idx].actor = e.target.value;
                      setFlowSteps(updated);
                    }}
                    className="w-24 px-2 py-1 bg-white border border-slate-200 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Aksi Pengguna"
                    value={st.action}
                    onChange={(e) => {
                      const updated = [...flowSteps];
                      updated[idx].action = e.target.value;
                      setFlowSteps(updated);
                    }}
                    className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Respon Sistem"
                    value={st.systemResponse}
                    onChange={(e) => {
                      const updated = [...flowSteps];
                      updated[idx].systemResponse = e.target.value;
                      setFlowSteps(updated);
                    }}
                    className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...flowSteps];
                      updated.splice(idx, 1);
                      updated.forEach((s, i) => (s.order = i + 1));
                      setFlowSteps(updated);
                    }}
                    className="text-slate-400 hover:text-red-600 px-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={flowNotes}
              onChange={(e) => setFlowNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setFlowModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Flow
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Screen */}
      <Modal isOpen={screenModalOpen} onClose={() => setScreenModalOpen(false)} title="Layar / Wireframe Lo-Fi" maxWidth="max-w-xl">
        <form onSubmit={handleSaveScreen} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Layar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Halaman Login"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Layar</label>
            <input
              type="text"
              placeholder="Keterangan fungsi tampilan layar ini"
              value={screenDesc}
              onChange={(e) => setScreenDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Wireframe Asset Viewer & Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gambar Wireframe Lo-Fi</label>
            <WireframeAssetViewer
              assetId={screenAssetId}
              projectId={projectId}
              fsdId={fsd.id}
              moduleId={module.id}
              screenId={editingScreenIndex !== null ? module.screens[editingScreenIndex].id : 'temp-screen'}
              onAssetChanged={(newAssetId) => setScreenAssetId(newAssetId)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Caption Gambar</label>
              <input
                type="text"
                placeholder="Contoh: Gambar 1: Form Login"
                value={screenCaption}
                onChange={(e) => setScreenCaption(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alt Text</label>
              <input
                type="text"
                placeholder="Deskripsi aksesibilitas"
                value={screenAlt}
                onChange={(e) => setScreenAlt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Anotasi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Daftar Anotasi Bernomor</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Ketik anotasi dan tekan +"
                value={annotationInput}
                onChange={(e) => setAnnotationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAnnotation();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddAnnotation}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                +
              </button>
            </div>
            <ul className="space-y-1 max-h-36 overflow-y-auto">
              {screenAnnotations.map((ann, aIdx) => (
                <li key={aIdx} className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                      {ann.number}
                    </span>
                    <span>{ann.text}</span>
                  </div>
                  <button type="button" onClick={() => handleRemoveAnnotation(aIdx)} className="text-slate-400 hover:text-red-600">
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setScreenModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Layar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Requirement */}
      <Modal isOpen={reqModalOpen} onClose={() => setReqModalOpen(false)} title="Functional Requirement" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveReq} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Requirement <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Otentikasi Email dan Password"
              value={reqName}
              onChange={(e) => setReqName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi & Perilaku Sistem</label>
            <textarea
              rows={3}
              placeholder="Jelaskan kebutuhan fungsional secara rinci..."
              value={reqDesc}
              onChange={(e) => setReqDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioritas (MoSCoW)</label>
              <select
                value={reqPriority}
                onChange={(e) => setReqPriority(e.target.value as FunctionalRequirement['priority'])}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Must">Must Have</option>
                <option value="Should">Should Have</option>
                <option value="Could">Could Have</option>
                <option value="Won't">Won't Have</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={reqStatus}
                onChange={(e) => setReqStatus(e.target.value as RequirementStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {REQUIREMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Relational Pickers for Traceability */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <RelationalIdPicker
              title="Tautkan ke Alur Proses (Flow)"
              description="Pilih alur proses bisnis yang mengimplementasikan requirement ini."
              options={module.flows.map((f) => ({ id: f.id, label: f.name }))}
              selectedIds={reqFlowIds}
              onChange={setReqFlowIds}
              emptyMessage="Belum ada Alur Proses di modul ini."
            />

            <RelationalIdPicker
              title="Tautkan ke Layar / Wireframe (Screen)"
              description="Pilih layar tampilan UI tempat requirement ini ditampilkan ke pengguna."
              options={module.screens.map((s) => ({ id: s.id, label: s.name }))}
              selectedIds={reqScreenIds}
              onChange={setReqScreenIds}
              emptyMessage="Belum ada Layar Wireframe di modul ini."
            />

            <RelationalIdPicker
              title="Tautkan ke Acceptance Criteria (AC)"
              description="Pilih kriteria pengujian Given-When-Then yang memvalidasi requirement ini."
              options={module.acceptanceCriteria.map((a) => ({ id: a.id, label: a.name }))}
              selectedIds={reqAcIds}
              onChange={setReqAcIds}
              emptyMessage="Belum ada Acceptance Criteria di modul ini."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setReqModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Requirement
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Business Rule */}
      <Modal isOpen={brModalOpen} onClose={() => setBrModalOpen(false)} title="Business Rule">
        <form onSubmit={handleSaveBr} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Aturan Bisnis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Penguncian Akun Setelah 5 Kali Gagal"
              value={brName}
              onChange={(e) => setBrName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Aturan</label>
            <textarea
              rows={2}
              value={brDesc}
              onChange={(e) => setBrDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rasional Bisnis / Alasan Kebijakan</label>
            <input
              type="text"
              placeholder="Contoh: Mencegah serangan brute-force dan pencurian kredensial"
              value={brRationale}
              onChange={(e) => setBrRationale(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <RelationalIdPicker
              title="Tautkan ke Functional Requirement"
              description="Pilih requirement yang mendasari atau diatur oleh aturan bisnis ini."
              options={module.requirements.map((r) => ({ id: r.id, label: r.name, badge: r.priority }))}
              selectedIds={brReqIds}
              onChange={setBrReqIds}
              emptyMessage="Belum ada Functional Requirement di modul ini."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setBrModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Rule
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 5: Validation */}
      <Modal isOpen={valModalOpen} onClose={() => setValModalOpen(false)} title="Validation Rule" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveVal} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Field / Input <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: email, password"
                value={valField}
                onChange={(e) => setValField(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Label Validasi</label>
              <input
                type="text"
                placeholder="Contoh: Format Email"
                value={valName}
                onChange={(e) => setValName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">
                Daftar Aturan Validasi (Rules) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddValRuleRow}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Tambah Rule
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {valRules.map((ruleRow, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Rule #{rIdx + 1}
                    </span>
                    {valRules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveValRuleRow(rIdx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        title="Hapus rule ini"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Rule Type <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: required, email"
                        value={ruleRow.rule}
                        onChange={(e) => handleValRuleChange(rIdx, 'rule', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Value / Parameter <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 8, RFC 5322"
                        value={ruleRow.value}
                        onChange={(e) => handleValRuleChange(rIdx, 'value', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono bg-white"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Error Message
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Email wajib diisi"
                        value={ruleRow.errorMessage}
                        onChange={(e) => handleValRuleChange(rIdx, 'errorMessage', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-red-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2.5">
              <button
                type="button"
                onClick={handleAddValRuleRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Tambah Rule
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <RelationalIdPicker
              title="Tautkan ke Functional Requirement"
              description="Pilih requirement yang mewajibkan aturan validasi ini."
              options={module.requirements.map((r) => ({ id: r.id, label: r.name, badge: r.priority }))}
              selectedIds={valReqIds}
              onChange={setValReqIds}
              emptyMessage="Belum ada Functional Requirement di modul ini."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setValModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Validasi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 6: Integration */}
      <Modal isOpen={intModalOpen} onClose={() => setIntModalOpen(false)} title="Integration Requirement">
        <form onSubmit={handleSaveInt} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Integrasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Single Sign-On Google OAuth"
                value={intName}
                onChange={(e) => setIntName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Service SA</label>
              <input
                type="text"
                placeholder="Contoh: Identity Provider Team"
                value={intOwner}
                onChange={(e) => setIntOwner(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Input / Payload Parameter</label>
            <textarea
              rows={2}
              placeholder="Contoh: auth_code, redirect_uri, client_id"
              value={intInput}
              onChange={(e) => setIntInput(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Outcome / Respon Sistem</label>
            <textarea
              rows={2}
              placeholder="Contoh: Access Token JWT, user_id, email"
              value={intOutcome}
              onChange={(e) => setIntOutcome(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <RelationalIdPicker
              title="Tautkan ke Functional Requirement"
              description="Pilih requirement yang memanfaatkan antarmuka / integrasi sistem ini."
              options={module.requirements.map((r) => ({ id: r.id, label: r.name, badge: r.priority }))}
              selectedIds={intReqIds}
              onChange={setIntReqIds}
              emptyMessage="Belum ada Functional Requirement di modul ini."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIntModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Integrasi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 7: Error State */}
      <Modal isOpen={errModalOpen} onClose={() => setErrModalOpen(false)} title="Error Handling & UI State">
        <form onSubmit={handleSaveErr} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Kondisi Error <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Kredensial Tidak Cocok"
              value={errName}
              onChange={(e) => setErrName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pemicu Error (Trigger)</label>
            <input
              type="text"
              placeholder="Contoh: Password salah dimasukkan atau email belum terdaftar"
              value={errTrigger}
              onChange={(e) => setErrTrigger(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pesan Layar (User Message)</label>
            <input
              type="text"
              placeholder="Contoh: Email atau kata sandi salah. Silakan coba lagi."
              value={errUserMessage}
              onChange={(e) => setErrUserMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-rose-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tindakan Pemulihan (Recovery)</label>
            <input
              type="text"
              placeholder="Contoh: Tampilkan link Lupa Password dan fokuskan kursor ke input password"
              value={errRecovery}
              onChange={(e) => setErrRecovery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setErrModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Error State
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 8: NFR */}
      <Modal isOpen={nfrModalOpen} onClose={() => setNfrModalOpen(false)} title="Security & NFR">
        <form onSubmit={handleSaveNfr} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori NFR</label>
              <select
                value={nfrCategory}
                onChange={(e) => setNfrCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Security">Security</option>
                <option value="Performance">Performance</option>
                <option value="Reliability">Reliability</option>
                <option value="Availability">Availability</option>
                <option value="Compliance">Compliance</option>
                <option value="Usability">Usability</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kebutuhan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Waktu Respon Login"
                value={nfrName}
                onChange={(e) => setNfrName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Metrik Target / SLA <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: < 500 ms p95 pada 1000 concurrent user"
              value={nfrMeasure}
              onChange={(e) => setNfrMeasure(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi & Ruang Uji</label>
            <textarea
              rows={2}
              value={nfrDesc}
              onChange={(e) => setNfrDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setNfrModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan NFR
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 9: Acceptance Criteria (Given-When-Then) */}
      <Modal isOpen={acModalOpen} onClose={() => setAcModalOpen(false)} title="Acceptance Criterion (Given-When-Then)" maxWidth="max-w-2xl">
        <form onSubmit={handleSaveAc} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Acceptance Criterion <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Sukses Login dengan Kredensial Valid"
              value={acName}
              onChange={(e) => setAcName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Skenario Given–When–Then</label>
              <button
                type="button"
                onClick={() =>
                  setAcScenarios([
                    ...acScenarios,
                    { title: '', given: [''], when: '', then: [''] },
                  ])
                }
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                + Tambah Skenario
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto p-1">
              {acScenarios.map((sc, scIdx) => (
                <div key={scIdx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-700 border-b border-slate-200 pb-1">
                    <span>Skenario #{scIdx + 1}</span>
                    {acScenarios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...acScenarios];
                          updated.splice(scIdx, 1);
                          setAcScenarios(updated);
                        }}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  {/* Scenario title input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Nama / Judul Skenario
                    </label>
                    <input
                      type="text"
                      placeholder={`Contoh: Happy Path, Password Salah, Akun Terkunci...`}
                      value={sc.title || ''}
                      onChange={(e) => {
                        const updated = [...acScenarios];
                        updated[scIdx].title = e.target.value;
                        setAcScenarios(updated);
                      }}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {/* Given inputs */}
                  <div className="space-y-1">
                    <span className="font-bold text-blue-700 block">GIVEN:</span>
                    {sc.given.map((gVal, gIdx) => (
                      <div key={gIdx} className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Kondisi awal..."
                          value={gVal}
                          onChange={(e) => {
                            const updated = [...acScenarios];
                            updated[scIdx].given[gIdx] = e.target.value;
                            setAcScenarios(updated);
                          }}
                          className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded"
                        />
                        {sc.given.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...acScenarios];
                              updated[scIdx].given.splice(gIdx, 1);
                              setAcScenarios(updated);
                            }}
                            className="text-slate-400 hover:text-red-600 px-1"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...acScenarios];
                        updated[scIdx].given.push('');
                        setAcScenarios(updated);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      + Tambah GIVEN / AND
                    </button>
                  </div>

                  {/* When input */}
                  <div>
                    <span className="font-bold text-amber-700 block mb-0.5">WHEN:</span>
                    <input
                      type="text"
                      required
                      placeholder="Aksi pemicu oleh pengguna..."
                      value={sc.when}
                      onChange={(e) => {
                        const updated = [...acScenarios];
                        updated[scIdx].when = e.target.value;
                        setAcScenarios(updated);
                      }}
                      className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded"
                    />
                  </div>

                  {/* Then inputs */}
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-700 block">THEN:</span>
                    {sc.then.map((tVal, tIdx) => (
                      <div key={tIdx} className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Hasil / respon yang diharapkan..."
                          value={tVal}
                          onChange={(e) => {
                            const updated = [...acScenarios];
                            updated[scIdx].then[tIdx] = e.target.value;
                            setAcScenarios(updated);
                          }}
                          className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded"
                        />
                        {sc.then.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...acScenarios];
                              updated[scIdx].then.splice(tIdx, 1);
                              setAcScenarios(updated);
                            }}
                            className="text-slate-400 hover:text-red-600 px-1"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...acScenarios];
                        updated[scIdx].then.push('');
                        setAcScenarios(updated);
                      }}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      + Tambah THEN / AND
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <RelationalIdPicker
              title="Tautkan ke Functional Requirement"
              description="Pilih requirement yang diuji atau divalidasi oleh skenario acceptance criteria ini."
              options={module.requirements.map((r) => ({ id: r.id, label: r.name, badge: r.priority }))}
              selectedIds={acReqIds}
              onChange={setAcReqIds}
              emptyMessage="Belum ada Functional Requirement di modul ini."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAcModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Kriteria
            </button>
          </div>
        </form>
      </Modal>

      {/* Global Datalist for Features */}
      <datalist id="module-features-datalist">
        {allFeatures.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      {/* Modal: Tambah Fitur Baru */}
      <Modal
        isOpen={isAddFeatureModalOpen}
        onClose={() => setIsAddFeatureModalOpen(false)}
        title="Tambah Fitur Baru"
        description="Fitur ini akan tersedia sebagai kategori pengelompokan alur proses, layar wireframe, kebutuhan fungsional, dan acceptance criteria."
      >
        <form onSubmit={handleAddNewFeature} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Fitur <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Login, Registrasi, Forgot Password, Logout"
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddFeatureModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Simpan Fitur
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
