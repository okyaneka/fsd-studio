import createJiti from 'jiti';

const jiti = createJiti(import.meta.url);
const { createArtifactId, createEmptyModule, createFsdDocument, createStarterWorkspace, validateBackupPayload } = await jiti.import('../src/core/schema.ts');

const { project, fsd } = createStarterWorkspace({ name: 'Core verification', code: 'CORE' });
const authentication = fsd.modules[0];

if (authentication.code !== 'AUTH' || Object.keys(authentication.sectionStates).length !== 9) {
  throw new Error('Starter workspace must include Authentication and all nine mandatory sections.');
}
if (createEmptyModule().flows.length !== 0) throw new Error('A subsequent FSD module must start empty.');
if (createArtifactId('requirement', 'AUTH', 1, 'login') !== 'FR-AUTH-LOGIN-01') throw new Error('Requirement ID convention failed.');
if (createArtifactId('acceptanceCriterion', 'AUTH', 1, 'login', { prefix: 'client', sequenceDigits: 2 }) !== 'AC-CLIENT-AUTH-LOGIN-01') throw new Error('Prefix or acceptance-criterion ID convention failed.');
const prefixedDocument = createFsdDocument({ projectId: project.id, idPrefix: 'client', withAuthenticationStarter: true });
if (prefixedDocument.idConvention.prefix !== 'CLIENT' || prefixedDocument.idConvention.sequenceDigits !== 2 || prefixedDocument.modules[0].flows[0].id !== 'FLOW-CLIENT-AUTH-LOGIN') throw new Error('Prefix convention was not persisted to the starter FSD.');

const validPayload = { format: 'fsd-studio-backup', version: 1, exportedAt: new Date().toISOString(), projects: [project], fsdDocuments: [fsd], assets: [] };
validateBackupPayload(validPayload);

const invalidPayload = {
  ...validPayload,
  assets: [{ id: 'bad-asset', projectId: project.id, fsdId: fsd.id, moduleId: 'missing-module', screenId: 'missing-screen', name: 'x.png', mimeType: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' }],
};
let rejected = false;
try { validateBackupPayload(invalidPayload); } catch { rejected = true; }
if (!rejected) throw new Error('Import validation accepted an asset with broken relations.');

console.log('Core schema, factory, stable-ID, and backup-validation checks passed.');
