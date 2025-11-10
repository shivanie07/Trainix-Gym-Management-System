// Renders modals, forms, & section visibility
import { getDocs, collection, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebaseConfig.js";
import { addMember, updateMember, deleteMember } from "./db.js";
import { login, signup, logout } from "./auth.js";
import { logInfo, logError } from "./logger.js";

// Section navigation (Hash-based routing)
export function showSection(sectionId) {
    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((sec) => sec.classList.remove("active"));
    const target = document.querySelector(sectionId);
    if (target) {
        target.classList.add("active");
        logInfo("Switched section", { section: sectionId });
    }
}

// Initialize hash-based routing
export function initNavigation() {
    window.addEventListener("hashchange", () => {
        showSection(location.hash || "#home");
    });
    showSection(location.hash || "#home");
}

// Toasts/Snackbars
export function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

export function hideToast() {
    document.querySelectorAll(".toast").forEach((el) => el.remove());
}

// Admin Login/Signup Modal
export function initAuthUI() {
    const modalRoot = document.getElementById("modalRoot");
    const showAdminBtn = document.getElementById("showAdminAuth");
    const showMemberBtn = document.getElementById("showMemberAuth");

    if (!showAdminBtn || !showMemberBtn) return;

    const closeModal = () => (modalRoot.innerHTML = "");

    // Admin Modal
    const showAuthModal = (role, mode = "login") => {
        const isLogin = mode === "login";
        const title = `${isLogin ? "Login" : "Sign Up"} as Admin`;

        modalRoot.innerHTML = `
        <div class="modal-overlay">
        <div class="modal-card">
            <h3>${title}</h3>
            <input id="authEmail" type="email" class="input" placeholder="Email">
            <input id="authPassword" type="password" class="input" placeholder="Password">
            <div class="actions">
                <button id="authSubmitBtn" class="btn">${isLogin ? "Login" : "Sign Up"}</button>
                <button id="toggleAuthModeBtn" class="btn secondary">${isLogin ? "Create Account" : "Already have an account? Login"}</button>
                <button id="cancelAuthModalBtn" class="btn secondary">Cancel</button>
            </div>
        </div>
        </div>
        `;

        document.getElementById("cancelAuthModalBtn").onclick = () => closeModal();
        document.getElementById("toggleAuthModeBtn").onclick = () => {
            showAuthModal(role, isLogin ? "signup" : "login");
        };

        document.getElementById("authSubmitBtn").onclick = async () => {
            const email = document.getElementById("authEmail").value.trim();
            const password = document.getElementById("authPassword").value;
            if (!email || !password) {
                showToast("Please enter email and password", "error");
                return;
            }
            try {
                if (isLogin) {
                    await login(email, password);
                } else {
                    await signup(email, password);
                }
                showToast("Authentication successful", "success");
                closeModal();
            } catch (err) {
                logError("Authentication failed", err);
            }
        };
    };

    // Member Login Modal
    const showMemberLoginModal = () => {
        const modalRoot = document.getElementById("modalRoot");
        modalRoot.innerHTML = `
        <div class="modal-overlay">
        <div class="modal-card">
            <h3>Member Login</h3>
            <input id="memberNameInput" class="input" placeholder="Enter your Name">
            <input id="memberIdInput" class="input" placeholder="Enter your Member ID">
            <div class="actions">
                <button id="memberLoginBtn" class="btn">Login</button>
                <button id="cancelMemberLoginBtn" class="btn secondary">Cancel</button>
            </div>
        </div>
        </div>
        `;

        document.getElementById("cancelMemberLoginBtn").onclick = () => closeModal();

        document.getElementById("memberLoginBtn").onclick = async () => {
            const name = document.getElementById("memberNameInput").value.trim();
            const memberId = document.getElementById("memberIdInput").value.trim();

            if (!name || !memberId) {
                showToast("Please enter both Name and Member ID", "error");
                return;
            }

            try {
                const q = query(
                    collection(db, "members"),
                    where("memberId", "==", memberId),
                    where("name", "==", name)
                );
                const snap = await getDocs(q);

                if (snap.empty) {
                    showToast("No member found with this Name and ID", "error");
                    return;
                }

                const member = snap.docs[0].data();
                showToast(`Welcome, ${member.name}`, "success");
                modalRoot.innerHTML = "";
                showSection("#member");

                const logoutBtn = document.getElementById("logoutBtn");
                if (logoutBtn) {
                    logoutBtn.classList.remove("d-none");
                    logoutBtn.onclick = async () => {
                        try {
                            localStorage.removeItem("memberSession");
                            const profileEl = document.getElementById("memberProfile");
                            const billsEl = document.getElementById("memberBills");
                            if (profileEl) profileEl.innerHTML = "";
                            if (billsEl) billsEl.innerHTML = "";

                            logoutBtn.classList.add("d-none");
                            showSection("#home");
                            location.hash = "#home";
                            showToast("Logged out successfully", "info");
                        } catch (err) {
                            logError("Member logout failed", err);
                            showToast("Logout failed", "error");
                        }
                    };
                }

                const { listBillsForMember } = await import("./db.js");
                const bills = await listBillsForMember(memberId);

                const profileEl = document.getElementById("memberProfile");
                const billsEl = document.getElementById("memberBills");

                profileEl.innerHTML = `
                    <p><strong>Name:</strong> ${member.name}</p>
                    <p><strong>Member ID:</strong> ${memberId}</p>
                `;

                if (bills.length === 0) {
                    billsEl.innerHTML = `<p class="muted">No bills found.</p>`;
                } else {
                    billsEl.innerHTML = bills.map(b =>
                        `<div class="list-item">
                            <strong>Amount:</strong> ${b.amount} - ${b.status}
                            <span class="muted">(${new Date(b.date || b.createdAt?.seconds * 1000).toLocaleDateString()})</span>
                        </div>`
                    ).join("");
                }
                logInfo("Member logged in via Firestore", { memberId, name });
            } catch (err) {
                logError("Member login failed", err);
                showToast("Member login failed", "error");
            }
        };
    };

    showAdminBtn.onclick = () => showAuthModal("admin", "login");
    showMemberBtn.onclick = () => showMemberLoginModal();
}

//Logout Modals
export function initLogoutUI() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", async () => {
        try {
            logoutBtn.disabled = true;

            await logout().catch(() => {});
            localStorage.removeItem("memberSession");

            const profileEl = document.getElementById("memberProfile");
            const billsEl = document.getElementById("memberBills");
            if (profileEl) profileEl.innerHTML = "";
            if (billsEl) billsEl.innerHTML = "";

            logoutBtn.classList.add("d-none");
            showSection("#home");
            location.hash = "#home";
            showToast("Logged out successfully", "success");
        } catch (err) {
            logError("Logout failed", err);
            showToast("Logout failed", "error");
        } finally {
            logoutBtn.disabled = false;
        }
    });
}

// Modals (Add/Edit Member)
export function showMemberFormModal(existingMember = null) {
    const root = document.getElementById("modalRoot");
    if (!root) {
        logError("Modal root not found");
        return;
    }

    const isEdit = !!existingMember;

    if (isEdit) {
        root.innerHTML = `
    <div class="modal-overlay">
        <div class="modal-card">
            <h3>Edit Member</h3>
            <input id="memberName" class="input" placeholder="Name" value="${existingMember?.name || ""}">
            <input id="memberPhone" class="input" placeholder="Phone" value="${existingMember?.phone || ""}">
            <input id="memberPackage" class="input" placeholder="Package" value="${existingMember?.package || ""}">
            <input id="memberStartDate" type="date" class="input" value="${existingMember?.startDate || ""}">
            <div class="actions">
                <button id="saveMemberBtn" class="btn">Update</button>
                <button id="cancelModalBtn" class="btn secondary">Cancel</button>
                <button id="openBillModalBtn" class="btn success">+ Add Bill</button>
            </div>
        </div>
    </div>
    `;
    } else {
        root.innerHTML = `
    <div class="modal-overlay">
        <div class="modal-card">
            <h3>Add New Member</h3>
            <input id="memberName" class="input" placeholder="Name">
            <input id="memberPhone" class="input" placeholder="Phone">
            <input id="memberPackage" class="input" placeholder="Package">
            <input id="memberStartDate" type="date" class="input">
            <div class="actions">
                <button id="saveMemberBtn" class="btn">Add</button>
                <button id="cancelModalBtn" class="btn secondary">Cancel</button>
            </div>
        </div>
    </div>
    `;
    }

    const nameEl = document.getElementById("memberName");
    const phoneEl = document.getElementById("memberPhone");
    const pkgEl = document.getElementById("memberPackage");
    const dateEl = document.getElementById("memberStartDate");
    const saveBtn = document.getElementById("saveMemberBtn");
    const cancelBtn = document.getElementById("cancelModalBtn");

    if (!nameEl || !phoneEl || !pkgEl || !dateEl || !saveBtn) {
        logError("Member form elements not found");
        return;
    }

    cancelBtn.onclick = () => (root.innerHTML = "");

    saveBtn.onclick = async () => {
        const name = nameEl.value.trim();
        const phone = phoneEl.value.trim();
        const pkg = pkgEl.value.trim();
        const startDate = dateEl.value;

        if (!name || !phone || !pkg || !startDate) {
            showToast("Please fill in all fields", "error");
            return;
        }

        try {
            if (isEdit) {
                await updateMember(existingMember.id, { name, phone, package: pkg, startDate });
                showToast("Member updated successfully", "success");
            } else {
                await addMember({ name, phone, package: pkg, startDate });
                showToast("Member added successfully", "success");
            }
            root.innerHTML = "";
        } catch (err) {
            logError("Member form failed", err);
            showToast("Error saving member", "error");
        }
    };

    // Add bill functionality
    const openBillModalBtn = document.getElementById("openBillModalBtn");
    if (openBillModalBtn) {
        openBillModalBtn.onclick = () => {
            root.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-card">
                    <h3>Add Bill for ${existingMember.name}</h3>
                    <input id="billAmount" class="input" placeholder="Bill Amount">
                    <select id="billStatus" class="input">
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </select>
                    <input id="billDate" type="date" class="input">
                    <div class="actions">
                        <button id="addBillBtn" class="btn success">Add Bill</button>
                        <button id="cancelBillBtn" class="btn secondary">Cancel</button>
                    </div>
                </div>
            </div>
            `;

            document.getElementById("cancelBillBtn").onclick = () => showMemberFormModal(existingMember);
            document.getElementById("addBillBtn").onclick = async () => {
                const amount = document.getElementById("billAmount").value.trim();
                const status = document.getElementById("billStatus").value;
                const date = document.getElementById("billDate").value;

                if (!amount || !date) {
                    showToast("Please fill in all fields", "error");
                    return;
                }

                try {
                    const { createBill } = await import("./db.js");
                    await createBill({
                        memberId: existingMember.id,
                        amount: parseFloat(amount),
                        status,
                        date,
                    });
                    showToast("Bill added successfully", "success");
                    showMemberFormModal(existingMember);
                } catch (err) {
                    logError("Add bill failed", err);
                    showToast("Failed to add bill", "error");
                }
            };
        };
    }
}

// Render member list
export function renderMemberList(members, onEdit, onDelete) {
    const container = document.getElementById("membersList");
    if (!container) return;

    if (members.length === 0) {
        container.innerHTML = `<p class="muted">No members found.</p>`;
        return;
    }

    container.innerHTML = members
        .map(
            (m) => `
        <div class="list-item">
        <div>
            <strong>${m.name}</strong><br/>
            <span class="muted">${m.phone}</span> | 
            <span>${m.package}</span>
            <span class="muted">Member Id: ${m.memberId || m.id}</span>
        </div>
        <div class="actions">
            <button class="btn small edit" data-id="${m.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn small danger" data-id="${m.id}"><i class="bi bi-trash"></i></button>
        </div>
        </div>`
        )
        .join("");

    // Attach event listeners
    container.querySelectorAll(".edit").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            const member = members.find((m) => m.id === id);
            onEdit(member);
        })
    );

    container.querySelectorAll(".danger").forEach((btn) =>
        btn.addEventListener("click", async (e) => {
            const id = e.currentTarget.dataset.id;
            const member = members.find((m) => m.id === id);
            if (confirm(`Delete ${member.name}?`)) {
                try {
                    await deleteMember(id);
                    showToast("Member deleted", "info");
                    onDelete();
                } catch (err) {
                    logError("Delete member failed", err);
                    showToast("Failed to delete member", "error");
                }
            }
        })
    );
}