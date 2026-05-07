export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method tidak diizinkan'
        });
    }

    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

        const CHAT_IDS = process.env.TELEGRAM_CHAT_IDS
            ? process.env.TELEGRAM_CHAT_IDS.split(',').map(id => id.trim()).filter(Boolean)
            : [];

        if (!BOT_TOKEN) {
            return res.status(500).json({
                success: false,
                message: 'TELEGRAM_BOT_TOKEN belum diset'
            });
        }

        if (CHAT_IDS.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'TELEGRAM_CHAT_IDS belum diset'
            });
        }

        const { respondent, inputs, emissions, score } = req.body;

        if (!respondent || !inputs || !emissions || !score) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak lengkap'
            });
        }

        const message = `
🌿 <b>HASIL KALKULATOR JEJAK KARBON</b>

👤 <b>Data Responden</b>
Nama: ${escapeHtml(respondent.fullName)}
NIM: ${escapeHtml(respondent.nim)}

🚗 <b>Transportasi</b>
Mobil: ${formatNumber(inputs.carDistance)} km
Motor: ${formatNumber(inputs.motorDistance)} km
Transportasi Umum: ${formatNumber(inputs.publicTransport)} km
Total Transportasi: ${formatNumber(emissions.transport)} kg CO₂e

⚡ <b>Listrik & Energi</b>
Listrik: ${formatNumber(inputs.electricity)} kWh
Gas LPG: ${formatNumber(inputs.gas)} kg
Total Energi: ${formatNumber(emissions.energy)} kg CO₂e

🍽️ <b>Makanan</b>
Daging Merah: ${formatNumber(inputs.redMeat)} kg
Susu & Produk Susu: ${formatNumber(inputs.dairy)} liter
Total Makanan: ${formatNumber(emissions.food)} kg CO₂e

📊 <b>Hasil Akhir</b>
Total Emisi: ${formatNumber(emissions.total)} kg CO₂e/minggu
Kategori: ${escapeHtml(score.label)}
Keterangan: ${escapeHtml(score.description)}

📅 Dikirim otomatis dari website Ekasena.
        `.trim();

        const sendResults = [];

        for (const chatId of CHAT_IDS) {
            const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const telegramData = await telegramResponse.json();

            sendResults.push({
                chatId,
                success: telegramData.ok,
                response: telegramData
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Data berhasil dikirim ke Telegram',
            results: sendResults
        });

    } catch (error) {
        console.error('Telegram API Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
}

// Supaya karakter HTML tidak merusak format pesan Telegram
function escapeHtml(text) {
    if (!text) return '';

    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Format angka agar rapi
function formatNumber(value) {
    const number = Number(value) || 0;
    return number.toFixed(1);
                              }
