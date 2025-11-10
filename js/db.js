//Firestore Crud(members, bills)
import { db } from "./firebaseConfig.js";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    serverTimestamp,
    orderBy,
    limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { logInfo, logError } from "./logger.js";

// Member login lookup
export async function getMemberByIdAndName(name, memberId) {
    try {
        const q = query(
            collection(db, "members"),
            where("name", "==", name),
            where("name", "==", memberId)
        );

        const snapshot = await getDocs(q);
        if(snapshot.empty) {
            logInfo("Member not found", { name, memberId });
            return null;
        }

        const docData = snapshot.docs[0];
        logInfo("Member lookup successful", { name, memberId });
        return { id: docData.id, ...docData.data() };
    } catch (err) {
        logError("Login failed", err);
        return null;
    }
}

// Member Operations:-
// Add a new member
export async function addMember(member) {
    try {
        const ref = await addDoc(collection(db, "members"), {
            ...member,
            createdAt: serverTimestamp()
        });
        await updateDoc(ref, {memberId: ref.id});

        logInfo("Member added", { 
            id: ref.id, 
            memberId: ref.id,
            name: member.name,
            phone: member.phone,
            package: member.package,
            startDate: member.startDate
        });
        return ref.id;
    } catch (err) {
        logError("addMember failed", err);
        throw err;
    }
}

// Update existing member
export async function updateMember(memberId, updates) {
    try {
        const ref = doc(db, "members", memberId);
        await updateDoc(ref, updates);
        logInfo("Member updated", { id: memberId, ...updates });
    } catch (err) {
        logError("updateMember failed", err);
        throw err;
    }
}

// Delete a member
export async function deleteMember(memberId) {
    try {
        await deleteDoc(doc(db, "members", memberId));
        logInfo("Member deleted", { id: memberId });
    } catch (err) {
        logError("deleteMember failed", err);
        throw err;
    }
}

// List all members
export async function listMembers(sortField = "name", sortDir = "asc") {
    try {
        const q = query(
            collection(db, "members"),
            orderBy(sortField, sortDir),
            limit(50)
        );
        const snapshot = await getDocs(q);
        const members = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        logInfo("Members listed", { count: members.length });
        return members;
    } catch (err) {
        logError("listMembers failed", err);
        return [];
    }
}

// Bill Operations
export async function createBill(bill) {
    try {
        const ref = await addDoc(collection(db, "bills"), {
            ...bill,
            createdAt: serverTimestamp(),
        });
        logInfo("Bill created", { id: ref.id, ...bill });
        return ref.id;
    } catch (err) {
        logError("createBill failed", err);
        throw err;
    }
}

// List bills for a given member
export async function listBillsForMember(memberId) {
    try {
        const q = query(
            collection(db, "bills"),
            where("memberId", "==", memberId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const bills = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        logInfo("Bills listed", { memberId, count: bills.length });
        return bills;
    } catch (err) {
        logError("listBillsForMember failed", err);
        return [];
    }
}
