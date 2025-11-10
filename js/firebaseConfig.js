// Initialize firebase & exports db/auth
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    connectAuthEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAsaU1EzfaIRF_2HQR58dg4dV3ugyJ757A",
    authDomain: "gym-manage-app.firebaseapp.com",
    projectId: "gym-manage-app",
    storageBucket: "gym-manage-app.firebasestorage.app",
    messagingSenderId: "741739480255",
    appId: "1:741739480255:web:7eaba314aee9141351320a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators for local development
connectAuthEmulator(auth, "http://localhost:9099");
connectFirestoreEmulator(db, "localhost", 8080);

console.log("Connected to Firebase emulators.");

window.addEventListener("load", () => {
    const removeBanner = () => {
        document.querySelectorAll("body *").forEach((el) => {
            if (
                el.textContent?.includes("Running in emulator mode") ||
                el.textContent?.includes("Do not use with production credentials")
            ) {
                el.style.display = "none";
            }
        });

        document.querySelectorAll("iframe").forEach((frame) => {
            try {
                const doc = frame.contentDocument || frame.contentWindow.document;
                if (!doc) return;
                doc.querySelectorAll("*").forEach((el) => {
                    if (
                        el.textContent?.includes("Running in emulator mode") ||
                        el.textContent?.includes("Do not use with production credentials")
                    ) {
                        el.style.display = "none";
                    }
                });
            } catch {}
        });
    };

    const interval = setInterval(removeBanner, 500);
    setTimeout(() => clearInterval(interval), 6000);
});

export { app, auth, db };
