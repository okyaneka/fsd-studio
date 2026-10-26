import { DATABASE_NAME, DATABASE_VERSION, STORES } from './constants';
import type { AssetRecord, FsdDocument, Project, WorkspaceRecords } from './types';

type StoreName = (typeof STORES)[keyof typeof STORES];
let databasePromise: Promise<IDBDatabase> | undefined;

export function getDatabase(): Promise<IDBDatabase> {
  if (!databasePromise) databasePromise = openDatabase();
  return databasePromise;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB.'));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORES.projects)) database.createObjectStore(STORES.projects, { keyPath: 'id' });
      if (!database.objectStoreNames.contains(STORES.fsdDocuments)) {
        const store = database.createObjectStore(STORES.fsdDocuments, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!database.objectStoreNames.contains(STORES.assets)) {
        const store = database.createObjectStore(STORES.assets, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('fsdId', 'fsdId', { unique: false });
        store.createIndex('moduleId', 'moduleId', { unique: false });
        store.createIndex('screenId', 'screenId', { unique: false });
      }
      if (database.objectStoreNames.contains(STORES.assets)) {
        const store = request.transaction?.objectStore(STORES.assets);
        if (store && !store.indexNames.contains('moduleId')) store.createIndex('moduleId', 'moduleId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function complete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Database transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Database transaction aborted.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Database request failed.'));
  });
}

export async function getAllRecords<T>(storeName: StoreName): Promise<T[]> {
  const transaction = (await getDatabase()).transaction(storeName, 'readonly');
  const done = complete(transaction);
  const result = await requestResult(transaction.objectStore(storeName).getAll() as IDBRequest<T[]>);
  await done;
  return result;
}

export async function getRecord<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const transaction = (await getDatabase()).transaction(storeName, 'readonly');
  const done = complete(transaction);
  const result = await requestResult(transaction.objectStore(storeName).get(id) as IDBRequest<T | undefined>);
  await done;
  return result;
}

export async function putRecord<T>(storeName: StoreName, record: T): Promise<T> {
  const transaction = (await getDatabase()).transaction(storeName, 'readwrite');
  const done = complete(transaction);
  transaction.objectStore(storeName).put(record);
  await done;
  return record;
}

export async function createProjectWithStarterFsd(project: Project, fsd: FsdDocument): Promise<{ project: Project; fsd: FsdDocument }> {
  const transaction = (await getDatabase()).transaction([STORES.projects, STORES.fsdDocuments], 'readwrite');
  const done = complete(transaction);
  transaction.objectStore(STORES.projects).add(project);
  transaction.objectStore(STORES.fsdDocuments).add(fsd);
  await done;
  return { project, fsd };
}

export async function getFsdDocumentsForProject(projectId: string): Promise<FsdDocument[]> {
  const transaction = (await getDatabase()).transaction(STORES.fsdDocuments, 'readonly');
  const done = complete(transaction);
  const index = transaction.objectStore(STORES.fsdDocuments).index('projectId');
  const result = await requestResult(index.getAll(projectId) as IDBRequest<FsdDocument[]>);
  await done;
  return result;
}

export async function deleteProjectAndRelatedRecords(projectId: string): Promise<void> {
  const transaction = (await getDatabase()).transaction(Object.values(STORES), 'readwrite');
  const done = complete(transaction);
  const documents = await requestResult(transaction.objectStore(STORES.fsdDocuments).index('projectId').getAll(projectId) as IDBRequest<FsdDocument[]>);
  const assets = await requestResult(transaction.objectStore(STORES.assets).index('projectId').getAll(projectId) as IDBRequest<AssetRecord[]>);
  transaction.objectStore(STORES.projects).delete(projectId);
  documents.forEach((document) => transaction.objectStore(STORES.fsdDocuments).delete(document.id));
  assets.forEach((asset) => transaction.objectStore(STORES.assets).delete(asset.id));
  await done;
}

export async function deleteFsdDocumentAndRelatedRecords(fsdId: string): Promise<void> {
  const transaction = (await getDatabase()).transaction([STORES.fsdDocuments, STORES.assets], 'readwrite');
  const done = complete(transaction);
  const assets = await requestResult(transaction.objectStore(STORES.assets).index('fsdId').getAll(fsdId) as IDBRequest<AssetRecord[]>);
  transaction.objectStore(STORES.fsdDocuments).delete(fsdId);
  assets.forEach((asset) => transaction.objectStore(STORES.assets).delete(asset.id));
  await done;
}

export async function deleteAssetsForModule(moduleId: string): Promise<void> {
  const transaction = (await getDatabase()).transaction(STORES.assets, 'readwrite');
  const done = complete(transaction);
  const assets = await requestResult(transaction.objectStore(STORES.assets).index('moduleId').getAll(moduleId) as IDBRequest<AssetRecord[]>);
  assets.forEach((asset) => transaction.objectStore(STORES.assets).delete(asset.id));
  await done;
}

export async function getWorkspaceRecords(): Promise<WorkspaceRecords> {
  const [projects, fsdDocuments, assets] = await Promise.all([
    getAllRecords<Project>(STORES.projects),
    getAllRecords<FsdDocument>(STORES.fsdDocuments),
    getAllRecords<AssetRecord>(STORES.assets),
  ]);
  return { projects, fsdDocuments, assets };
}

export async function replaceWorkspaceRecords({ projects, fsdDocuments, assets }: WorkspaceRecords): Promise<void> {
  const transaction = (await getDatabase()).transaction(Object.values(STORES), 'readwrite');
  const done = complete(transaction);
  Object.values(STORES).forEach((storeName) => transaction.objectStore(storeName).clear());
  projects.forEach((project) => transaction.objectStore(STORES.projects).put(project));
  fsdDocuments.forEach((document) => transaction.objectStore(STORES.fsdDocuments).put(document));
  assets.forEach((asset) => transaction.objectStore(STORES.assets).put(asset));
  await done;
}
