/**
 * IndexedDB-based image storage for generated images
 * Handles large base64 image data that exceeds localStorage limits
 */

const DB_NAME = 'flowboard-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

interface StoredImage {
  id: string;
  projectId: string;
  nodeId: string;
  imageData: string; // base64 data URL
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('nodeId', 'nodeId', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Generate a unique ID for an image
 */
export function generateImageId(projectId: string, nodeId: string, index: number = 0): string {
  return `${projectId}:${nodeId}:${index}`;
}

/**
 * Store an image in IndexedDB
 */
export async function storeImage(
  projectId: string,
  nodeId: string,
  imageData: string,
  index: number = 0
): Promise<string> {
  const db = await getDB();
  const id = generateImageId(projectId, nodeId, index);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record: StoredImage = {
      id,
      projectId,
      nodeId,
      imageData,
      createdAt: Date.now(),
    };

    const request = store.put(record);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store multiple images for a node (batch generation)
 */
export async function storeImages(
  projectId: string,
  nodeId: string,
  images: { imageUrl: string; seed?: number }[]
): Promise<string[]> {
  const ids: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const id = await storeImage(projectId, nodeId, images[i].imageUrl, i);
    ids.push(id);
  }

  return ids;
}

/**
 * Retrieve an image from IndexedDB
 */
export async function getImage(id: string): Promise<string | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const result = request.result as StoredImage | undefined;
      resolve(result?.imageData || null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve all images for a node
 */
export async function getImagesForNode(nodeId: string): Promise<StoredImage[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('nodeId');
    const request = index.getAll(nodeId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete all images for a project
 */
export async function deleteProjectImages(projectId: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('projectId');
    const request = index.getAllKeys(projectId);

    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach((key) => store.delete(key));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete images for a specific node
 */
export async function deleteNodeImages(nodeId: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('nodeId');
    const request = index.getAllKeys(nodeId);

    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach((key) => store.delete(key));
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all images for a project (for export)
 */
export async function getAllProjectImages(projectId: string): Promise<StoredImage[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('projectId');
    const request = index.getAll(projectId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Import images from an exported project
 */
export async function importProjectImages(
  projectId: string,
  images: { nodeId: string; imageData: string; index: number }[]
): Promise<void> {
  for (const img of images) {
    await storeImage(projectId, img.nodeId, img.imageData, img.index);
  }
}

/**
 * Clear all stored images (for debugging/reset)
 */
export async function clearAllImages(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
