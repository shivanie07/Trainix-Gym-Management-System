// Unified logging system: console + Firestore
import { db } from "./firebaseConfig.js";
import {
    collection,
    addDoc,
    serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LOG_PREFIX = "[GMS]";

// Console Logging Helpers
export function logInfo(message, meta = {}) {
    console.info(`${LOG_PREFIX} ${message}`, meta);
    persistLog("info", message, sanitizeMeta(meta));
}

export function logWarn(message, meta = {}) {
    console.warn(`${LOG_PREFIX} ${message}`, meta);
    persistLog("warn", message, sanitizeMeta(meta));
}

export function logError(message, error) {
    console.error(`${LOG_PREFIX} ${message}`, error);
    
    const safeError = 
        error instanceof Error
        ? { message: error.message, stack: error.stack }
        : typeof error === "object"
        ? sanitizeMeta(error)
        : { message: String(error) };
    
    persistLog("error", message, safeError);    
}

// Sanitize objects before saving
function sanitizeMeta(meta) {
    try {
        return JSONparse(
            JSONstringify(meta, (key, value) => (value === undefined ? null : value))
        );
    } catch {
        return { info: "Meta sanitization failed" };
    }
}

// Persist Logs to Firestore
async function persistLog(level, message, meta = {}) {
    try {
        if (!db) return;

        await addDoc(collection(db, "logs"), {
            level,
            message,
            meta: sanitizeMeta(meta),
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn(`${LOG_PREFIX} Log persist failed`, err);
    }
}
