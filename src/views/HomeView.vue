<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const daftarRuangan = ref([])
const loading = ref(true)
const riwayatTerbuka = ref({}) // Menyimpan data riwayat per ID ruangan

// Fungsi mengambil data utama
const ambilDataRuangan = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/ruangan')
    daftarRuangan.value = response.data.data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// Fungsi mengubah Mode (Auto <-> Manual)
const gantiMode = async (ruangan) => {
  const modeBaru = ruangan.mode_kontrol === 'AUTO' ? 'MANUAL' : 'AUTO'
  try {
    await axios.put(`http://localhost:3000/api/ruangan/${ruangan.id}/mode`, { mode: modeBaru })
    ruangan.mode_kontrol = modeBaru
  } catch (error) {
    alert('Gagal mengubah mode!')
  }
}

// Fungsi mengirim perintah Nyala/Mati manual
const kontrolManual = async (ruangan, perintahAksi) => {
  try {
    await axios.post(`http://localhost:3000/api/ruangan/${ruangan.id}/kontrol`, {
      aksi: perintahAksi,
      merk: ruangan.merk_ac
    })
    ruangan.status_ac_terakhir = perintahAksi === 'TURN_ON' ? 'ON' : 'OFF'
    
    // Jika riwayat sedang terbuka, segarkan datanya agar aksi barusan langsung muncul
    if (riwayatTerbuka.value[ruangan.id]) {
      lihatRiwayat(ruangan.id, true)
    }
  } catch (error) {
    alert('Gagal mengirim perintah!')
  }
}

// Fungsi Mengambil & Menampilkan Riwayat
const lihatRiwayat = async (idRuangan, forceRefresh = false) => {
  // Jika tombol ditekan dan riwayat sudah terbuka (dan bukan perintah refresh), maka tutup riwayatnya
  if (riwayatTerbuka.value[idRuangan] && !forceRefresh) {
    riwayatTerbuka.value[idRuangan] = null
    return
  }

  try {
    const response = await axios.get(`http://localhost:3000/api/ruangan/${idRuangan}/riwayat`)
    riwayatTerbuka.value[idRuangan] = response.data.data
  } catch (error) {
    alert('Gagal mengambil data riwayat!')
  }
}

// Fungsi untuk merapikan format tanggal & jam
const formatWaktu = (waktu) => {
  const options = { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }
  return new Date(waktu).toLocaleDateString('id-ID', options)
}

onMounted(() => {
  ambilDataRuangan()
})
</script>

<template>
  <main class="container">
    <header class="header">
      <h1>Smart AC Controller</h1>
      <p>Universitas PGRI Madiun</p>
    </header>

    <div v-if="loading" class="loading">Memuat data ruangan...</div>

    <div v-else class="room-list">
      <div v-for="ruangan in daftarRuangan" :key="ruangan.id" class="card">
        
        <div class="card-header">
          <h2>{{ ruangan.nama_ruangan }}</h2>
          <span :class="['badge', ruangan.status_ac_terakhir === 'ON' ? 'badge-on' : 'badge-off']">
            {{ ruangan.status_ac_terakhir }}
          </span>
        </div>
        
        <div class="card-body">
          <p>🌡️ Batas Suhu: {{ ruangan.batas_suhu_bawah }}°C - {{ ruangan.batas_suhu_atas }}°C</p>
          <p>🏷️ Merk AC: {{ ruangan.merk_ac }}</p>
        </div>

        <hr class="divider" />

        <div class="control-area">
          <div class="mode-toggle">
            <span class="mode-label">Mode: <strong>{{ ruangan.mode_kontrol }}</strong></span>
            <button @click="gantiMode(ruangan)" class="btn btn-mode">Ganti Mode</button>
          </div>

          <div class="manual-controls">
            <button @click="kontrolManual(ruangan, 'TURN_ON')" class="btn btn-on" :disabled="ruangan.mode_kontrol === 'AUTO'">Nyalakan AC</button>
            <button @click="kontrolManual(ruangan, 'TURN_OFF')" class="btn btn-off" :disabled="ruangan.mode_kontrol === 'AUTO'">Matikan AC</button>
          </div>
        </div>

        <div class="history-toggle">
          <button @click="lihatRiwayat(ruangan.id)" class="btn btn-history">
            {{ riwayatTerbuka[ruangan.id] ? 'Tutup Riwayat ▲' : 'Lihat Riwayat ▼' }}
          </button>
        </div>

        <div v-if="riwayatTerbuka[ruangan.id]" class="history-list">
          <h4 class="history-title">5 Aktivitas Terakhir</h4>
          <ul v-if="riwayatTerbuka[ruangan.id].length > 0">
            <li v-for="(item, index) in riwayatTerbuka[ruangan.id]" :key="index" class="history-item">
              <div class="history-icon">
                {{ item.aksi_ac === 'TURN_ON' ? '🟢' : '🔴' }}
              </div>
              <div class="history-detail">
                <span class="history-trigger">{{ item.pemicu }}</span>
                <span class="history-time">{{ formatWaktu(item.waktu_eksekusi) }}</span>
              </div>
            </li>
          </ul>
          <p v-else class="no-history">Belum ada aktivitas terekam.</p>
        </div>
        
      </div>
    </div>
  </main>
</template>

<style scoped>
.container { padding: 20px; font-family: sans-serif; max-width: 480px; margin: 0 auto; background-color: #f4f7f6; min-height: 100vh;}
.header { text-align: center; margin-bottom: 30px; }
.header h1 { color: #2c3e50; margin-bottom: 5px; font-size: 1.5rem; }
.header p { color: #7f8c8d; margin: 0; font-size: 0.9rem;}
.loading { text-align: center; color: #3498db; margin-top: 50px; }
.card { background: #fff; border-radius: 12px; padding: 15px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e0e0e0; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.card-header h2 { font-size: 1.1rem; margin: 0; color: #333; }
.badge { padding: 5px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; color: white; }
.badge-on { background-color: #2ecc71; }
.badge-off { background-color: #e74c3c; }
.card-body p { margin: 5px 0; color: #555; font-size: 0.9rem; }
.divider { border: 0; border-top: 1px solid #eee; margin: 15px 0; }
.control-area { display: flex; flex-direction: column; gap: 15px; }
.mode-toggle { display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 10px; border-radius: 8px; }
.mode-label { font-size: 0.9rem; color: #333; }
.manual-controls { display: flex; gap: 10px; }
.btn { flex: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: background-color 0.2s; font-size: 0.85rem;}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-mode { background-color: #f39c12; color: white; flex: 0 0 auto; padding: 8px 15px; }
.btn-on { background-color: #2ecc71; color: white; }
.btn-off { background-color: #e74c3c; color: white; }

/* Styling untuk Area Riwayat */
.history-toggle { margin-top: 15px; text-align: center; }
.btn-history { background-color: #ecf0f1; color: #2c3e50; width: 100%; padding: 8px; font-weight: normal; font-size: 0.85rem;}
.btn-history:hover { background-color: #bdc3c7; }
.history-list { margin-top: 15px; background: #fafafa; padding: 10px; border-radius: 8px; border: 1px dashed #ccc;}
.history-title { font-size: 0.85rem; color: #7f8c8d; margin: 0 0 10px 0; text-align: center;}
.history-item { display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee;}
.history-item:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0;}
.history-icon { font-size: 1.2rem; margin-right: 10px; }
.history-detail { display: flex; flex-direction: column; }
.history-trigger { font-size: 0.85rem; font-weight: bold; color: #333; }
.history-time { font-size: 0.75rem; color: #95a5a6; }
.no-history { font-size: 0.85rem; color: #95a5a6; text-align: center; margin: 10px 0; }
</style>