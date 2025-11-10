// Wires everything together
import { logout, watchAuthState } from "./auth.js";
import { listMembers } from "./db.js";
import {
    initNavigation,
    initAuthUI,
    initLogoutUI,
    showMemberFormModal,
    renderMemberList,
    showToast,
    showSection
} from "./UI.js";
import { renderCharts, updateCharts } from "./charts.js";
import { exportToCSV, exportToPDF } from "./export.js";
import { logInfo, logError } from "./logger.js";

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initAuthEvents();
    initAdminEvents();
    initAuthUI();
    initLogoutUI();
    restoreMemberSession();
    logInfo("App initialized");
});

// Authentication flow
function initAuthEvents() {
    const logoutBtn = document.getElementById("logoutBtn");
    const showMemberBtn = document.getElementById("showMemberBtn");
    const showAdminBtn = document.getElementById("showAdminBtn");

    // Auth button modal triggers
    if(showAdminBtn) showAdminBtn.onclick = () => showAuthModal("admin", "login");
    if(showMemberBtn) showMemberBtn.onclick = () => showMemberFormModal();

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await logout();
                clearDashboards();
                showToast("Logged out successfully", "success");

                logoutBtn.classList.add("d-none");
                showMemberBtn?.classList.remove("d-none");
                showAdminBtn?.classList.remove("d-none");

                showSection("#home");
                location.hash = "#home";
            } catch (err) {
                logError("Logout failed", err);
                showToast("Logout failed", "error");
            }
        });
    }

    watchAuthState(async (user, role) => {
        const logoutBtn = document.getElementById("logoutBtn");
        const showAdminBtn = document.getElementById("showAdminAuth");
        const showMemberBtn = document.getElementById("showMemberAuth");

        if (user && role === "admin") {
            logoutBtn?.classList.remove("d-none");
            showAdminBtn?.classList.add("d-none");
            showMemberBtn?.classList.add("d-none");

            showSection("#admin");
            await loadAdminDashboard();
        } else {
            clearDashboards();

            logoutBtn?.classList.add("d-none");
            showAdminBtn?.classList.remove("d-none");
            showMemberBtn?.classList.remove("d-none");

            showSection("#home");
            location.hash = "#home";
        }
    });
}

// Admin Dashboard
function initAdminEvents() {
    const addBtn = document.getElementById("addMemberBtn");
    if (addBtn) {
        addBtn.addEventListener("click", () => showMemberFormModal());
    }

    const exportCSVBtn = document.getElementById("exportCSVBtn");
    const exportPDFBtn = document.getElementById("exportPDFBtn");
    if (exportCSVBtn) exportCSVBtn.addEventListener("click", exportToCSV);
    if (exportPDFBtn) exportPDFBtn.addEventListener("click", exportToPDF);

    const sortSelect = document.getElementById("sortSelect");
    const sortDirBtn = document.getElementById("sortDirBtn");
    let sortDir = "asc";

    if (sortDirBtn && sortSelect) {
        // Handle direction change
        sortDirBtn.addEventListener("click", async () => {
            sortDir = sortDir === "asc" ? "desc" : "asc";
            const sortField = sortSelect.value;
            const members = await listMembers(sortField, sortDir);
            renderMemberList(members, showMemberFormModal, loadAdminDashboard);
            showToast(`Sorted by ${sortField} (${sortDir})`, "info");
        });

        // Handle field change
        sortSelect.addEventListener("change", async () => {
            const sortField = sortSelect.value;
            const members = await listMembers(sortField, sortDir);
            renderMemberList(members, showMemberFormModal, loadAdminDashboard);
            showToast(`Sorted by ${sortField} (${sortDir})`, "info");
        });
    }
}

// Load admin dashboard
async function loadAdminDashboard() {
    try {
        const sortField = document.getElementById("sortSelect").value || "name";
        const members = await listMembers(sortField);
        renderMemberList(members, showMemberFormModal, loadAdminDashboard);
        renderCharts(members);
        logInfo("Admin dashboard loaded");
    } catch (err) {
        logError("Failed to load admin dashboard", err);
        showToast("Failed to load admin dashboard", "error");
    }
}

// Member Login
window.addEventListener("memberLoggedIn", (e) => {
    const member = e.detail;
    logInfo("Member logged in.", member);
    showSection("#member");
    loadMemberDashboard(member.id, member.name);
    document.getElementById("logoutBtn")?.classList.remove("d-none");
});

// Restore member session
function restoreMemberSession() {
    const saved = JSON.parse(localStorage.getItem("memberSession") || "null");
    if (saved) {
        logInfo("Restored member session", saved);
        showSection("#member");
        loadMemberDashboard(saved.id, saved.name);
    }
}

// Member Dashboard
async function loadMemberDashboard(uid, name) {
    const profileEl = document.getElementById("memberProfile");
    const billsEl = document.getElementById("memberBills");
    if (!profileEl || !billsEl) return;

    profileEl.innerHTML = "";
    billsEl.innerHTML = "";

    profileEl.innerHTML = `
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Member ID:</strong> ${uid}</p>
    `;

    try {
        const { listBillsForMember } = await import("./db.js");
        const bills = await listBillsForMember(uid);

        bills.innerHTML = bills.length ? bills.map(
            (b) => `
            <div class="list-item">
            <strong>Amount:${b.amount}</strong> - ${b.status}
            <span class="muted">(${new Date(
                b.date || b.createdAt?.seconds * 1000
            ).toLocaleDateString()})</span>
            </div>
        `
        ).join("")
        : `<p class="muted">No bills found.</p>`;
        logInfo("Member dashboard loaded", {uid});
    } catch (err) {
        logError("Failed to load member dashboard", err);
        showToast("Failed to load member dashboard", "error");
    }
}

// Clear Dasboards on logout
function clearDashboards() {
    ["memberProfile", "memberBills", "membersList"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "";
    });
    logInfo("Dashboards cleared after logout");
}

// Chart refresh
export async function refreshCharts() {
    try {
        const sortField = document.getElementById("sortSelect").value || "name";
        const members = await listMembers(sortField);
        updateCharts(members);
    } catch (err) {
        logError("Chart refresh failed", err);
    }
}
