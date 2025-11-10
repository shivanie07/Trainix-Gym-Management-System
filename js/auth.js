// Handles firebase auth (sign in/out)
import { auth } from "./firebaseConfig.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { showToast } from "./UI.js";
import { logInfo, logError } from "./logger.js";

// Admin login using Firebase Auth
export async function login(email, password) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        logInfo("User logged in", { uid: user.uid, email: user.email });
        showToast(`Welcome back, ${user.email}`, "success");
        return user;
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            showToast("This email is not registered", "error");
        } else if (error.code === "auth/wrong-password") {
            showToast("Incorrect password", "error");
        } else {
            showToast("Login failed", "error");
        }
        logError("Login error", error);
        throw error;
    }
}

// Admin signup using Firebase Auth
export async function signup(email, password) {
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const user = cred.user;
        logInfo("New user signed up", { uid: user.uid, email: user.email });
        showToast(`Account created for ${user.email}`, "success");
        return user;
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
            showToast("This email is already registered", "error");
        } else if (error.code === "auth/invalid-email") {
            showToast("Invalid email address", "error");
        } else if (error.code === "auth/weak-password") {
            showToast("password should be at least 6 characters", "error");
        } else {
            showToast("Signup failed", "error");
        }
        logError("Signup error", error);
        throw error;
    }
}    

// Logout the current user
export async function logout() {
    try {
        await signOut(auth);
        localStorage.removeItem("memberSession");
        logInfo("User signed out");
        showToast("Signed out successfully", "info");
    } catch (error) {
        logError("Logout failed", error);
        showToast("Error while signing out", "error");
    }
}

// Identify if user is an admin
export function isAdminUser(email) {
    return (email && email.startsWith("admin@") || email.endsWith("@mygym.com"));
}

// Watch auth state changes
export function watchAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const role = isAdminUser(user.email) ? "admin" : "guest";
            logInfo("Auth state changed (admin logged in)", { email: user.email, role });
            callback(user, role);
        } else {
            logInfo("Auth state changed (logged out)");
            callback(null, "guest");
        }
    });
}
