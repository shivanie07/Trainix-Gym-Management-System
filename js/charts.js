import { logInfo, logError } from "./logger.js";

const chartScript = document.createElement("script");
chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
document.head.appendChild(chartScript);

// Global chart variables
let revenueChart = null;
let activeMembersChart = null;

// Initialize charts
export function renderCharts(members = []) {
    if (typeof Chart === "undefined") {
        chartScript.onload = () => renderCharts(members);
        return;
    }

    try {
        const revenueCtx = document.getElementById("revenueChart").getContext("2d");
        const activeCtx = document.getElementById("activeMembersChart").getContext("2d");

        const revenueData = calculateRevenueByPackage(members);
        const activeData = calculateActiveMembers(members);

        // Destroy old charts if they exist
        if (revenueChart) revenueChart.destroy();
        if (activeMembersChart) activeMembersChart.destroy();

        revenueChart = new Chart(revenueCtx, {
            type: "bar",
            data: {
                labels: Object.keys(revenueData),
                datasets: [
                    {
                        label: "Revenue (₹)",
                        data: Object.values(revenueData),
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: "Revenue by Package" },
                    legend: { display: false },
                },
            },
        });

        activeMembersChart = new Chart(activeCtx, {
            type: "doughnut",
            data: {
                labels: ["Active Members", "Inactive"],
                datasets: [
                    {
                        label: "Members",
                        data: [activeData.active, activeData.inactive],
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: "Active vs Inactive Members" },
                },
            },
        });

        logInfo("Charts rendered");
    } catch (err) {
        logError("Failed to render charts", err);
    }
}

// Update charts (After CRUD/Refresh)
export function updateCharts(members = []) {
    try {
        if (!revenueChart || !activeMembersChart) {
            renderCharts(members);
            return;
        }

        const revenueData = calculateRevenueByPackage(members);
        const activeData = calculateActiveMembers(members);

        revenueChart.data.labels = Object.keys(revenueData);
        revenueChart.data.datasets[0].data = Object.values(revenueData);
        revenueChart.update();

        activeMembersChart.data.datasets[0].data = [activeData.active, activeData.inactive];
        activeMembersChart.update();

        logInfo("Charts updated");
    } catch (err) {
        logError("Chart update failed", err);
    }
}

function calculateRevenueByPackage(members) {
    const revenue = {};
    for (const m of members) {
        const pkg = m.package || "Other";
        const amount = m.amount || guessAmount(pkg);
        revenue[pkg] = (revenue[pkg] || 0) + amount;
    }
    return revenue;
}

function calculateActiveMembers(members) {
    let active = 0;
    let inactive = 0;
    const today = new Date();
    for (const m of members) {
        const startDate = new Date(m.startDate);
        const daysDiff = (today - startDate) / (1000 * 60 * 60 * 24);
        if (daysDiff < 30) active++;
        else inactive++;
    }
    return { active, inactive };
}
