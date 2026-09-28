// Inicialização do Firebase compartilhada pelo site e pelo painel admin.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js';
import { firebaseConfig } from './firebase-config.js';

// Desenvolvimento: localStorage 'harmony.emulator' = '1' usa os emuladores locais do Firebase.
const useEmulator = ['localhost', '127.0.0.1'].includes(location.hostname)
    && localStorage.getItem('harmony.emulator') === '1';

const config = useEmulator
    ? { apiKey: 'demo-key', projectId: 'demo-harmony', authDomain: 'demo-harmony.firebaseapp.com' }
    : firebaseConfig;

export const isConfigured = Boolean(config.apiKey && config.projectId);
export const app = isConfigured ? initializeApp(config) : null;
export const db = app ? getFirestore(app) : null;

if (useEmulator && db) connectFirestoreEmulator(db, '127.0.0.1', 8080);
export const emulator = useEmulator;
