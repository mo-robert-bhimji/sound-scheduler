// app/lib/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface SoundSchedulerDB extends DBSchema {
  customSounds: {
    key: string;
    value: {
      id: string;
      data: Blob;
      name: string;
      createdAt: number;
    };
  };
}

// Database name and version
const DB_NAME = 'SoundSchedulerDB';
const DB_VERSION = 1;

// Initialize the database
export const initDB = async (): Promise<IDBPDatabase<SoundSchedulerDB>> => {
  return await openDB<SoundSchedulerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object store for custom sounds
      if (!db.objectStoreNames.contains('customSounds')) {
        db.createObjectStore('customSounds', { keyPath: 'id' });
      }
    },
  });
};

// Save a custom sound to IndexedDB
export const saveSound = async (
  id: string,
  data: Blob,
  name: string
): Promise<void> => {
  const db = await initDB();
  await db.put('customSounds', {
    id,
    data,
    name,
    createdAt: Date.now(),
  });
  console.log('? Sound saved to IndexedDB:', id);
};

// Get a custom sound from IndexedDB
export const getSound = async (
  id: string
): Promise<{ id: string; data: Blob; name: string; createdAt: number } | undefined> => {
  const db = await initDB();
  const sound = await db.get('customSounds', id);
  console.log('?? Sound retrieved from IndexedDB:', id, sound ? 'found' : 'not found');
  return sound;
};

// Delete a custom sound from IndexedDB
export const deleteSound = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('customSounds', id);
  console.log('??? Sound deleted from IndexedDB:', id);
};

// Get all custom sounds from IndexedDB
export const getAllSounds = async (): Promise<
  { id: string; data: Blob; name: string; createdAt: number }[]
> => {
  const db = await initDB();
  const sounds = await db.getAll('customSounds');
  console.log('?? All sounds retrieved:', sounds.length);
  return sounds;
};

// Clear all custom sounds from IndexedDB
export const clearAllSounds = async (): Promise<void> => {
  const db = await initDB();
  await db.clear('customSounds');
  console.log('?? All sounds cleared from IndexedDB');
};

// Check if IndexedDB is supported
export const isIndexedDBSupported = (): boolean => {
  return typeof indexedDB !== 'undefined';
};

// Get storage estimate (how much space we're using)
export const getStorageEstimate = async (): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
}> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
    
    return {
      usage,
      quota,
      percentUsed,
    };
  }
  
  return { usage: 0, quota: 0, percentUsed: 0 };
};