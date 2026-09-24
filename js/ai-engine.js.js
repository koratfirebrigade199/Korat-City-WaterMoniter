/**
 * AI Assistant / Decision Support Engine
 * สำหรับวิเคราะห์แนวโน้ม ประเมินความเสี่ยง และแนะนำการบัญชาการเหตุการณ์
 */

function runAIEngine(state) {
    const m164 = state.stations.M164.current;
    const m191 = state.stations.M191.current;
    const damOut = state.damData.outflow;
    const recentRainSum = state.rainData.slice(-3).reduce((a, b) => a + b, 0);

    let trendText = "";
    let riskText = "";
    let commandText = "";
    let bannerAlertClass = "bg-emerald-600";
    let alertBadge = "ปกติ";
    let alertBannerText = "สถานะปกติ: ระดับน้ำอยู่ในเกณฑ์ตระหนกและควบคุมได้ทุกจุด";

    // AI Logic Decision Matrix
    if (m164 >= 177.60 || m191 >= 174.00) {
        bannerAlertClass = "bg-red-600 animate-pulse";
        alertBadge = "วิกฤต (น้ำท่วม)";
        alertBannerText = "เตือนภัยวิกฤต: น้ำล้นตลิ่งในเขตเทศบาลนครนครราชสีมา! ให้เตรียมอพยพพื้นที่ลุ่มต่ำ";
        
        trendText = "ระดับน้ำในลำตะคองทะลักตลิ่งเนื่องจากปริมาณน้ำสะสมและน้ำหนุน เร่งระบายลงสู่น้ำมูลได้ช้า";
        riskText = "เสี่ยงสูงมาก: ชุมชนมิตรภาพ ซ.4, ชุมชน VIP, และชุมชนวัดศาลาลอย น้ำเริ่มเข้าท่วมบ้านเรือนลุ่มต่ำ";
        commandText = "1. ตั้งศูนย์บัญชาการ ณ เทศบาลนครฯ 2. เดินเครื่องสูบน้ำขนาดใหญ่ทุกจุด 3. แจ้งเตือนประชาชนยกของขึ้นที่สูงทันที";
    } else if (m164 >= 177.00 || m191 >= 173.40 || recentRainSum > 30) {
        bannerAlertClass = "bg-amber-500";
        alertBadge = "เฝ้าระวังสีส้ม";
        alertBannerText = "แจ้งเตือนเฝ้าระวัง: ระดับน้ำในลำตะคองสูงขึ้นต่อเนื่อง ใกล้ระดับตลิ่ง";

        trendText = "ฝนตกสะสมในช่วง 3 ชม. เกิน 30 มม. ประกอบกับเขื่อนมีการระบายน้ำเพิ่มขึ้น ระดับน้ำเพิ่มขึ้นราว 5-10 ซม./ชม.";
        riskText = "เฝ้าระวัง 6 ชุมชนเสี่ยงภัย โดยเฉพาะชุมชนมิตรภาพ ซ.4 และคุ้มวงษ์ ซึ่งมีระดับภูมิประเทศต่ำกว่าพื้นที่อื่น";
        commandText = "1. เตรียมพร้อมเครื่องสูบน้ำเคลื่อนที่ 2. จัดเจ้าหน้าที่ ปภ. เวรยามเฝ้าระวัง 24 ชม. 3. ตรวจสอบสิ่งกีดขวางทางน้ำ";
    } else {
        trendText = "ระดับน้ำลำน้ำลำตะคองทรงตัว ปริมาณฝนตกสะสมน้อย การไหลของน้ำคล่องตัวดี";
        riskText = "ความเสี่ยงต่ำ ยังไม่มีชุมชนใดได้รับผลกระทบจากน้ำล้นตลิ่ง";
        commandText = "เฝ้าระวังตามวงรอบปกติ อัปเดตข้อมูลสถานีตรวจวัดทุก 1 ชั่วโมง";
    }

    // Render to UI
    document.getElementById('ai-trend-analysis').innerText = trendText;
    document.getElementById('ai-risk-assessment').innerText = riskText;
    document.getElementById('ai-command-recommendation').innerText = commandText;

    const banner = document.getElementById('alert-banner');
    banner.className = `${bannerAlertClass} text-white px-4 py-3 shadow-md transition-all`;
    document.getElementById('alert-status-text').innerText = alertBannerText;
    document.getElementById('alert-level-badge').innerText = alertBadge;
}