/**
 * ระบบติดตามระดับน้ำและแจ้งเตือนภัยน้ำท่วม เทศบาลนครนครราชสีมา
 * แก้ไขปัญหาข้อมูลโหลดค้างด้วย Async/Await + Fallback Mechanism
 */

// โครงสร้างชุมชนเสี่ยงภัย 6 จุดยุทธศาสตร์
const riskCommunities = [
    { id: 1, name: "ชุมชนมิตรภาพ ซ.4 / คุ้มวงษ์", stationRef: "M164", alertThreshold: 177.10, bankLevel: 177.60 },
    { id: 2, name: "ชุมชนบุมะค่า / สำโรงจันทร์ / ท่าตะโก", stationRef: "M191", alertThreshold: 173.50, bankLevel: 174.00 },
    { id: 3, name: "ชุมชน VIP", stationRef: "M164", alertThreshold: 177.20, bankLevel: 177.60 },
    { id: 4, name: "ชุมชนเกษตรสามัคคี", stationRef: "M191", alertThreshold: 173.40, bankLevel: 174.00 },
    { id: 5, name: "ชุมชนหลังวัดสามัคคี, อบอุ่นพัฒนา", stationRef: "M164", alertThreshold: 177.00, bankLevel: 177.60 },
    { id: 6, name: "ชุมชนวัดศาลาลอย / ท้าวสุระ / มหาชัย", stationRef: "M191", alertThreshold: 173.60, bankLevel: 174.00 }
];

// ข้อมูลชุดตั้งต้น (Fallback / Mockup Data) ในกรณีที่ Fetch JSON หรือ API ไม่สำเร็จ
let appState = {
    lastUpdate: new Date().toLocaleString('th-TH'),
    damData: { volume: 245.80, capacity: 314.49, percent: 78.15, inflow: 3.20, outflow: 1.50 },
    stations: {
        M177: { name: "อ.สีคิ้ว", current: 241.80, bank: 243.30 },
        M191: { name: "อาคารแบ่งน้ำละลมหม้อ", current: 173.10, bank: 174.00 },
        M164: { name: "สะพาน VIP", current: 176.45, bank: 177.60 }
    },
    rainData: [0, 0, 1.2, 5.5, 12.0, 8.4, 2.1, 0.5, 0, 0, 0, 0]
};

let waterChartInstance = null;
let rainChartInstance = null;

// เริ่มทำงานเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', async () => {
    await loadLatestData(); // พยายามดึงข้อมูลก่อน
    initApp();               // เรนเดอร์หน้าจอทันที
});

/**
 * ดึงข้อมูลจาก data/latest_data.json
 * หากหาไฟล์ไม่เจอ ให้ใช้ Fallback Data ทันที ไม่ค้างที่สถานะกำลังโหลด
 */
async function loadLatestData() {
    try {
        const response = await fetch('./data/latest_data.json?t=' + new Date().getTime());
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        // อัปเดตค่าเข้า appState จาก JSON
        if (data.updated_at) appState.lastUpdate = data.updated_at;
        if (data.dam) appState.damData = data.dam;
        if (data.stations) {
            if (data.stations.M177) appState.stations.M177.current = data.stations.M177;
            if (data.stations.M191) appState.stations.M191.current = data.stations.M191;
            if (data.stations.M164) appState.stations.M164.current = data.stations.M164;
        }
        console.log("Data successfully loaded from JSON.");
    } catch (error) {
        console.warn("ไม่สามารถดึงข้อมูล JSON ได้ (ใช้ข้อมูลสำรองในระบบแทน):", error.message);
        appState.lastUpdate = new Date().toLocaleString('th-TH') + " (ข้อมูลสำรอง)";
    }
}

function initApp() {
    updateHeaderTime();
    renderOverviewCards();
    renderCommunityCards();
    initWaterLevelChart();
    initRainChart();
    
    // เรียกใช้ AI Engine ประเมินผล
    if (typeof runAIEngine === 'function') {
        runAIEngine(appState);
    }
    
    setupFormListener();
}

function updateHeaderTime() {
    const timeElem = document.getElementById('last-update-time');
    if (timeElem) {
        timeElem.innerText = appState.lastUpdate;
    }
}

function renderOverviewCards() {
    const damVol = document.getElementById('dam-volume');
    const damPct = document.getElementById('dam-percent');
    const damBar = document.getElementById('dam-bar');
    const damOut = document.getElementById('dam-outflow');
    const damIn = document.getElementById('dam-inflow');
    
    const m177 = document.getElementById('m177-level');
    const m164 = document.getElementById('m164-level');

    if (damVol) damVol.innerText = `${appState.damData.volume} ล้าน ม.³`;
    if (damPct) damPct.innerText = `${appState.damData.percent}%`;
    if (damBar) damBar.style.width = `${Math.min(appState.damData.percent, 100)}%`;
    if (damOut) damOut.innerText = `${appState.damData.outflow}`;
    if (damIn) damIn.innerText = `${appState.damData.inflow}`;

    if (m177) m177.innerText = `${appState.stations.M177.current.toFixed(2)} ม.รทก.`;
    if (m164) m164.innerText = `${appState.stations.M164.current.toFixed(2)} ม.รทก.`;
}

function renderCommunityCards() {
    const container = document.getElementById('community-cards-container');
    if (!container) return;
    
    container.innerHTML = '';

    riskCommunities.forEach(comm => {
        const station = appState.stations[comm.stationRef];
        let statusBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        let statusText = 'ปกติ';
        let icon = 'fa-circle-check text-emerald-500';

        if (station.current >= comm.bankLevel) {
            statusBg = 'bg-red-100 text-red-800 border-red-400 animate-pulse';
            statusText = 'น้ำล้นตลิ่ง - ท่วมขัง';
            icon = 'fa-triangle-exclamation text-red-600';
        } else if (station.current >= comm.alertThreshold) {
            statusBg = 'bg-amber-100 text-amber-800 border-amber-400';
            statusText = 'เฝ้าระวังพิเศษ';
            icon = 'fa-triangle-exclamation text-amber-600';
        }

        const card = document.createElement('div');
        card.className = `bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between`;
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-slate-800 text-sm">${comm.name}</h4>
                    <span class="text-xs px-2 py-0.5 rounded-md border ${statusBg} font-medium flex items-center gap-1">
                        <i class="fa-solid ${icon}"></i> ${statusText}
                    </span>
                </div>
                <p class="text-xs text-slate-500">อ้างอิงสถานี: <span class="font-semibold text-slate-700">${comm.stationRef}</span></p>
                <div class="mt-3 text-xs space-y-1">
                    <div class="flex justify-between text-slate-600">
                        <span>ระดับน้ำปัจจุบัน:</span>
                        <span class="font-bold">${station.current.toFixed(2)} ม.รทก.</span>
                    </div>
                    <div class="flex justify-between text-slate-500">
                        <span>ระดับเตือนภัย:</span>
                        <span>${comm.alertThreshold.toFixed(2)} ม.รทก.</span>
                    </div>
                    <div class="flex justify-between text-slate-500">
                        <span>ระดับตลิ่ง:</span>
                        <span>${comm.bankLevel.toFixed(2)} ม.รทก.</span>
                    </div>
                </div>
            </div>
            <div class="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <span class="text-slate-400">ห่างจากตลิ่ง: ${(comm.bankLevel - station.current).toFixed(2)} ม.</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function initWaterLevelChart() {
    const canvas = document.getElementById('waterLevelChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (waterChartInstance) waterChartInstance.destroy();

    waterChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['01:00', '03:00', '05:00', '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00', 'ปัจจุบัน'],
            datasets: [
                {
                    label: 'M.177 สีคิ้ว (ตลิ่ง 243.30)',
                    data: [241.2, 241.3, 241.4, 241.5, 241.5, 241.6, 241.7, 241.7, 241.8, 241.8, 241.8, appState.stations.M177.current],
                    borderColor: '#0284c7',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'M.191 ละลมหม้อ (ตลิ่ง 174.00)',
                    data: [172.5, 172.6, 172.7, 172.8, 172.8, 172.9, 173.0, 173.0, 173.1, 173.1, 173.1, appState.stations.M191.current],
                    borderColor: '#059669',
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'M.164 สะพาน VIP (ตลิ่ง 177.60)',
                    data: [175.8, 175.9, 176.0, 176.1, 176.2, 176.2, 176.3, 176.3, 176.4, 176.4, 176.4, appState.stations.M164.current],
                    borderColor: '#6366f1',
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function initRainChart() {
    const canvas = document.getElementById('rainChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (rainChartInstance) rainChartInstance.destroy();

    rainChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['01:00', '03:00', '05:00', '07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00', 'ปัจจุบัน'],
            datasets: [{
                label: 'ปริมาณฝน (มม./ชม.)',
                data: appState.rainData,
                backgroundColor: '#38bdf8',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function setupFormListener() {
    const form = document.getElementById('data-edit-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const station = document.getElementById('input-station').value;
        const val = parseFloat(document.getElementById('input-value').value);

        if (station in appState.stations) {
            appState.stations[station].current = val;
        } else if (station === 'DAM') {
            appState.damData.volume = val;
        }

        appState.lastUpdate = new Date().toLocaleString('th-TH') + " (อัปเดตภาคสนาม)";
        updateHeaderTime();
        renderOverviewCards();
        renderCommunityCards();
        initWaterLevelChart();
        if (typeof runAIEngine === 'function') runAIEngine(appState);

        alert(`ปรับปรุงข้อมูล ${station} เป็น ${val} เรียบร้อยแล้ว`);
        form.reset();
    });
}