// Handles exporting member data to CSV and PDF
import { listMembers } from "./db.js";
import { showToast } from "./UI.js";
import { logInfo, logError } from "./logger.js";

// Export to CSV
export async function exportToCSV() {
    try {
        const members = await listMembers();
        if (!members.length) {
            showToast("No members to export", "info");
            return;
        }

        const headers = ["Name", "Phone", "Package", "Start Date"];
        const rows = members.map((m) => [
            m.name,
            m.phone,
            m.package,
            m.startDate || "",
        ]);

        let csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "gym_members.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        logInfo("Exported members to CSV", { count: members.length });
        showToast("CSV file downloaded", "success");
    } catch (err) {
        logError("CSV export failed", err);
        showToast("Error exporting CSV", "error");
    }
}

// Export to PDF
export async function exportToPDF() {
    try {
        if (!window.jspdf) throw new Error("jsPDF not loaded");
        const {jsPDF} = window.jspdf;

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Gym Member Report", 14, 20);

        const rows = document.querySelectorAll("#memberList .list-item");
        if(rows.length === 0){
            doc.text("No members found.", 14, 40);
        } else {
            let y = 40;
            rows.forEach(row => {
                const name = row.querySelector("strong")?.textContent || "";
                const details = row.querySelector(".muted")?.textContent || "";
                const pkg = row.querySelector("span:not(.muted)")?.textContent || "";
                doc.text(`${name} | ${details} | ${pkg}`, 14, y);
                y += 10;
            });
        }

        doc.save("gym_members.pdf");
        showToast("PDF file downloaded", "success");
        logInfo("PDF exported successfully");
    } catch (err) {
        logError("PDF export failed", err);
        showToast("Error exporting PDF", "error");
    }
}
