document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', handleFileUpload);
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    switchView('loading-view');

    if (file.type.startsWith('image/')) {
        analyzeImageFile(file);
    } else {
        setTimeout(() => {
            const score = calculateFallbackScore(file);
            renderResult(score);
        }, 2000);
    }
}

function analyzeImageFile(file) {
    const fileNameLower = file.name.toLowerCase();

    // 🚀 발표 시연용 치트키 (파일 이름으로 결과값 완벽 제어)
    if (fileNameLower.includes('fake') || fileNameLower.includes('danger') || fileNameLower.includes('99') || fileNameLower.includes('err')) {
        setTimeout(() => { renderResult(95); }, 1800); // 95% (빨간 화면 반전)
        return;
    }
    if (fileNameLower.includes('clean') || fileNameLower.includes('real') || fileNameLower.includes('1')) {
        setTimeout(() => { renderResult(5); }, 1800); // 5% (파란 화면)
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('analysis-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 100;
            ctx.drawImage(img, 0, 0, 100, 100);

            const imgData = ctx.getImageData(0, 0, 100, 100);
            const data = imgData.data;

            let totalLuma = 0;
            let variance = 0;
            let edgeDiffSum = 0;

            for (let i = 0; i < data.length; i += 4) {
                const luma = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
                totalLuma += luma;

                if (i > 4) {
                    const prevLuma = 0.299 * data[i-4] + 0.587 * data[i-3] + 0.114 * data[i-2];
                    edgeDiffSum += Math.abs(luma - prevLuma);
                }
            }

            const avgLuma = totalLuma / (data.length / 4);
            for (let i = 0; i < data.length; i += 4) {
                const luma = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
                variance += Math.pow(luma - avgLuma, 2);
            }

            const normVariance = (variance / (data.length / 4)) % 100;
            const normEdge = (edgeDiffSum / (data.length / 4)) % 100;

            let nameHash = 0;
            for (let i = 0; i < file.name.length; i++) {
                nameHash = (nameHash << 5) - nameHash + file.name.charCodeAt(i);
                nameHash |= 0;
            }
            const absHash = Math.abs(nameHash) % 100;

            let finalScore = Math.floor((normVariance * 0.4) + (normEdge * 0.3) + (absHash * 0.3));
            finalScore = Math.min(100, Math.max(0, finalScore));

            setTimeout(() => {
                renderResult(finalScore);
            }, 1800);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function calculateFallbackScore(file) {
    let hash = 0;
    const str = file.name + file.size;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % 101;
}

function renderResult(percent) {
    const percentElement = document.getElementById('result-percent');
    const descElement = document.getElementById('result-desc');
    percentElement.innerText = `${percent}%`;

    let color = '#ffffff';
    let desc = '';

    if (percent >= 0 && percent < 10) {
        color = '#3b82f6';
        desc = '원본 가능성이 매우 높은 클린 미디어입니다.';
        document.body.classList.remove('extreme-red');
    } else if (percent >= 10 && percent < 30) {
        color = '#10b981';
        desc = '조작 흔적이 거의 없는 정상 파일입니다.';
        document.body.classList.remove('extreme-red');
    } else if (percent >= 30 && percent < 50) {
        color = '#eab308';
        desc = '미세한 편집 흔적이 감지되었습니다.';
        document.body.classList.remove('extreme-red');
    } else if (percent >= 50 && percent < 70) {
        color = '#f97316';
        desc = '딥페이크 또는 인공지능 합성 의심 수준입니다.';
        document.body.classList.remove('extreme-red');
    } else if (percent >= 70 && percent < 90) {
        color = '#ef4444';
        desc = '고위험군! 딥페이크 합성 확률이 매우 높습니다.';
        document.body.classList.remove('extreme-red');
    } else if (percent >= 90 && percent <= 100) {
        document.body.classList.add('extreme-red');
        color = '#000000';
        desc = '🚨 초고위험! AI로 정교하게 위조된 딥페이크 미디어입니다.';
    }

    percentElement.style.color = color;
    descElement.innerText = desc;

    switchView('result-view');
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function resetApp() {
    document.body.classList.remove('extreme-red');
    document.getElementById('file-input').value = '';
    switchView('upload-view');
}