// Data konversi emisi CO2 (kg CO2e per unit perminggu)
const EMISSION_FACTORS = {
    // Transportasi (kg CO2 per km)
    car: 0.20,
    motorcycle: 0.08,
    publicTransport: 0.06,

    // Energi
    electricity: 0.75,
    gas: 2.98,

    // Makanan
    redMeat: 30,
    dairy: 2.0
};

// Batasan untuk penilaian
const SCORE_LIMITS = {
    good: 25,          // < 25 kg = Baik
    moderate: 40,      // 25 - 40 kg = Sedang
    high: 60,          // 40 - 60 kg = Tinggi
    veryHigh: Infinity // >= 60 kg = Sangat Tinggi
};

// Tips berdasarkan kategori
const TIPS = {
    transport: [
        "Gunakan transportasi umum atau sepeda untuk perjalanan pendek",
        "Car sharing atau ride sharing bisa mengurangi emisi hingga 50%",
        "Pertimbangkan kendaraan listrik untuk mengurangi emisi transportasi"
    ],
    energy: [
        "Matikan lampu dan peralatan elektronik yang tidak digunakan",
        "Gunakan lampu LED dan peralatan hemat energi",
        "Pasang panel surya untuk mengurangi ketergantungan listrik PLN"
    ],
    food: [
        "Kurangi konsumsi daging merah, ganti dengan protein nabati",
        "Pilih susu nabati seperti oat milk atau almond milk",
        "Beli produk lokal untuk mengurangi emisi transportasi makanan"
    ],
    general: [
        "Tanam pohon atau dukung program reboisasi",
        "Gunakan reusable bag dan botol minum",
        "Dukung kebijakan ramah lingkungan di komunitas Anda"
    ]
};

// DOM Elements
const form = document.getElementById('carbonForm');
const results = document.getElementById('results');

function parseInputNumber(value) {
    if (!value) return 0;

    const cleanedValue = String(value)
        .trim()
        .replace(',', '.')
        .replace(/[^0-9.]/g, '');

    const number = parseFloat(cleanedValue);

    return isNaN(number) ? 0 : number;
}

// Event Listeners
form.addEventListener('submit', calculateCarbonFootprint);
document.getElementById('mobile-menu')?.addEventListener('click', toggleMobileMenu);

// Smooth scroll to calculator
function scrollToCalculator() {
    document.getElementById('calculator').scrollIntoView({
        behavior: 'smooth'
    });
}

// Mobile menu toggle
function toggleMobileMenu() {
    const nav = document.querySelector('.nav-container');
    nav.classList.toggle('active');
}

// Calculate carbon footprint
async function calculateCarbonFootprint(e) {
    e.preventDefault();

    // Ambil data responden
    const respondent = {
        fullName: document.getElementById('fullName').value.trim(),
        nim: document.getElementById('nim').value.trim()
    };

    if (!respondent.fullName || !respondent.nim) {
        alert('Nama lengkap dan NIM wajib diisi.');
        return;
    }

    // Ambil nilai input aktivitas
    const inputs = {
    carDistance: parseInputNumber(document.getElementById('carDistance').value),
    motorDistance: parseInputNumber(document.getElementById('motorDistance').value),
    publicTransport: parseInputNumber(document.getElementById('publicTransport').value),
    electricity: parseInputNumber(document.getElementById('electricity').value),
    gas: parseInputNumber(document.getElementById('gas').value),
    redMeat: parseInputNumber(document.getElementById('redMeat').value),
    dairy: parseInputNumber(document.getElementById('dairy').value)
};
    // Hitung emisi berdasarkan kategori
    const emissions = {
        transport:
            (inputs.carDistance * EMISSION_FACTORS.car) +
            (inputs.motorDistance * EMISSION_FACTORS.motorcycle) +
            (inputs.publicTransport * EMISSION_FACTORS.publicTransport),

        energy:
            (inputs.electricity * EMISSION_FACTORS.electricity) +
            (inputs.gas * EMISSION_FACTORS.gas),

        food:
            (inputs.redMeat * EMISSION_FACTORS.redMeat) +
            (inputs.dairy * EMISSION_FACTORS.dairy),

        total: 0
    };

    emissions.total = emissions.transport + emissions.energy + emissions.food;

    // Tampilkan hasil ke website
    displayResults(emissions);
    results.style.display = 'block';

    // Kirim hasil ke Telegram
    await sendResultToTelegram(respondent, inputs, emissions);

    // Scroll ke bagian hasil
    results.scrollIntoView({
        behavior: 'smooth'
    });
}

// Kirim hasil ke backend agar diteruskan ke Telegram
async function sendResultToTelegram(respondent, inputs, emissions) {
    try {
        const response = await fetch('/api/send-telegram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                respondent,
                inputs,
                emissions,
                score: {
                    label: getScoreLabel(emissions.total),
                    description: getScoreDescription(emissions.total)
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gagal kirim ke Telegram:', data);
            return;
        }

        console.log('Hasil berhasil dikirim ke Telegram:', data);
    } catch (error) {
        console.error('Error kirim ke Telegram:', error);
    }
}

// Display results
function displayResults(emissions) {
    // Update total emisi
    document.getElementById('totalCarbon').textContent = emissions.total.toFixed(1);

    // Update label dan deskripsi skor
    const scoreLabel = getScoreLabel(emissions.total);
    const scoreDesc = getScoreDescription(emissions.total);

    document.getElementById('scoreLabel').textContent = scoreLabel;
    document.getElementById('scoreDesc').textContent = scoreDesc;

    // Update warna lingkaran skor
    updateScoreCircle(emissions.total);

    // Update rincian emisi
    document.getElementById('transportValue').textContent = emissions.transport.toFixed(1);
    document.getElementById('energyValue').textContent = emissions.energy.toFixed(1);
    document.getElementById('foodValue').textContent = emissions.food.toFixed(1);

    // Update grafik batang
    updateBarCharts(emissions);

    // Update tips
    updateTips(emissions);
}

// Get score label
function getScoreLabel(total) {
    if (total < SCORE_LIMITS.good) return '👍 Baik';
    if (total < SCORE_LIMITS.moderate) return '⚠️ Sedang';
    if (total < SCORE_LIMITS.high) return '🔴 Tinggi';
    return '🚨 Sangat Tinggi';
}

// Get score description
function getScoreDescription(total) {
    if (total < SCORE_LIMITS.good) {
        return 'Jejak karbon Anda masih tergolong baik. Pertahankan kebiasaan ramah lingkungan ini.';
    } else if (total < SCORE_LIMITS.moderate) {
        return 'Jejak karbon Anda berada pada kategori sedang. Masih ada ruang untuk menguranginya.';
    } else if (total < SCORE_LIMITS.high) {
        return 'Jejak karbon Anda tergolong tinggi. Coba kurangi penggunaan energi, kendaraan pribadi, atau konsumsi tinggi emisi.';
    } else {
        return 'Jejak karbon Anda sangat tinggi. Perlu tindakan nyata untuk mengurangi dampak terhadap lingkungan.';
    }
}

// Update score circle color
function updateScoreCircle(total) {
    const circle = document.querySelector('.score-circle');
    let color;

    if (total < SCORE_LIMITS.good) {
        color = '#4CAF50'; // Baik - hijau
    } else if (total < SCORE_LIMITS.moderate) {
        color = '#FF9800'; // Sedang - oranye
    } else if (total < SCORE_LIMITS.high) {
        color = '#F44336'; // Tinggi - merah
    } else {
        color = '#B71C1C'; // Sangat Tinggi - merah tua
    }

    circle.style.background = `linear-gradient(135deg, ${color}20, ${color}30)`;
}

// Update bar charts
function updateBarCharts(emissions) {
    const total = emissions.total;
    const maxBarWidth = 80;

    // Hitung persentase setiap kategori
    const transportPct = total > 0 ? (emissions.transport / total) * 100 : 0;
    const energyPct = total > 0 ? (emissions.energy / total) * 100 : 0;
    const foodPct = total > 0 ? (emissions.food / total) * 100 : 0;

    // Reset dulu agar animasi terlihat ketika hitung ulang
    document.getElementById('transportBar').style.width = '0%';
    document.getElementById('energyBar').style.width = '0%';
    document.getElementById('foodBar').style.width = '0%';

    // Animasi bar
    setTimeout(() => {
        document.getElementById('transportBar').style.width = `${Math.min(transportPct * maxBarWidth / 100, maxBarWidth)}%`;
        document.getElementById('energyBar').style.width = `${Math.min(energyPct * maxBarWidth / 100, maxBarWidth)}%`;
        document.getElementById('foodBar').style.width = `${Math.min(foodPct * maxBarWidth / 100, maxBarWidth)}%`;
    }, 100);
}

// Update tips
function updateTips(emissions) {
    const tipsList = document.getElementById('tipsList');
    let tipsHtml = '';

    if (emissions.transport > 0) {
        tipsHtml += generateTipsHTML(
            TIPS.transport,
            'fas fa-car',
            '#FF6B6B',
            'Tips Transportasi'
        );
    }

    if (emissions.energy > 0) {
        tipsHtml += generateTipsHTML(
            TIPS.energy,
            'fas fa-bolt',
            '#4ECDC4',
            'Tips Energi'
        );
    }

    if (emissions.food > 0) {
        tipsHtml += generateTipsHTML(
            TIPS.food,
            'fas fa-utensils',
            '#45B7D1',
            'Tips Makanan'
        );
    }

    tipsHtml += generateTipsHTML(
        TIPS.general,
        'fas fa-leaf',
        '#96CEB4',
        'Tips Umum'
    );

    tipsList.innerHTML = tipsHtml;
}

// Generate tips HTML
function generateTipsHTML(tips, icon, color, title) {
    let html = `
        <div class="tips-category">
            <div class="tips-header" style="border-left-color: ${color};">
                <i class="${icon}" style="color: ${color};"></i>
                <span>${title}</span>
            </div>

            <ul class="tips-category-list">
    `;

    tips.slice(0, 3).forEach(tip => {
        html += `<li>${tip}</li>`;
    });

    html += `
            </ul>
        </div>
    `;

    return html;
}

// Reset calculator
function resetCalculator() {
    document.getElementById('carbonForm').reset();
    results.style.display = 'none';

    // Reset grafik batang
    document.querySelectorAll('.bar-fill').forEach(bar => {
        bar.style.width = '0%';
    });

    // Scroll kembali ke form
    document.querySelector('.calc-form').scrollIntoView({
        behavior: 'smooth'
    });
}

// Validasi input angka agar tidak minus
const numericInputIds = [
    'carDistance',
    'motorDistance',
    'publicTransport',
    'electricity',
    'gas',
    'redMeat',
    'dairy'
];

numericInputIds.forEach(id => {
    const input = document.getElementById(id);

    input.addEventListener('input', function () {
        this.value = this.value
            .replace(/[^0-9,\.]/g, '')
            .replace(/\./g, ',')
            .replace(/(,.*),/g, '$1');
    });
});

// Efek fokus pada label input
document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('focus', function () {
        const label = this.parentElement.querySelector('label');
        label.style.color = '#4CAF50';
        label.style.fontWeight = '600';
    });

    input.addEventListener('blur', function () {
        const label = this.parentElement.querySelector('label');
        label.style.color = '#444';
        label.style.fontWeight = '500';
    });
});

// Animasi elemen ketika discroll
function animateOnScroll() {
    const elements = document.querySelectorAll('.form-group, .results, .tips');

    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible) {
            el.classList.add('animate');
        }
    });
}

window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);

// CSS tambahan dari JavaScript
const style = document.createElement('style');

style.textContent = `
    .form-group, 
    .results, 
    .tips {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }

    .form-group.animate, 
    .results.animate, 
    .tips.animate {
        opacity: 1;
        transform: translateY(0);
    }

    .tips-category {
        margin-bottom: 1.5rem;
    }

    .tips-category:last-child {
        margin-bottom: 0;
    }

    .tips-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 0;
        border-left: 4px solid #4CAF50;
        padding-left: 1rem;
        font-weight: 600;
        color: #2d5a2d;
        margin-bottom: 1rem;
        background: rgba(255, 255, 255, 0.45);
        border-radius: 8px;
    }

    .tips-category-list {
        list-style: none;
        padding-left: 0;
    }

    .tips-category-list li {
        padding: 0.75rem 0;
        padding-left: 1.5rem;
        position: relative;
        color: #555;
        font-size: 0.95rem;
    }

    .tips-category-list li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #4CAF50;
        font-weight: bold;
    }

    @media (max-width: 768px) {
        .result-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
        }

        .score-circle {
            width: 160px;
            height: 160px;
        }

        .score-circle span {
            font-size: 2rem;
        }

        .chart-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
`;

document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    console.log('Jejak Karbonku loaded successfully! 🌿');
});
