<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="user-greeting">
        <h1>Halo, Admin</h1>
        <p>Pantau efisiensi AC kampus hari ini.</p>
      </div>
      <div class="header-actions">
        <button @click="goToHistory" class="btn-history">
          🕒 Riwayat
        </button>
        <div class="status-badge">
          <span class="pulse"></span> Online
        </div>
      </div>
    </header>

    <section class="device-section">
      <h2 class="section-title">Daftar Ruangan</h2>

      <div v-if="isLoading" class="loading-state">
        <p>Memuat data ruangan...</p>
      </div>

      <div v-else-if="devices.length === 0" class="empty-state">
        <p>Belum ada perangkat AC yang terdaftar.</p>
        <button @click="goToAddDevice" class="btn-outline">Tambahkan Alat Sekarang</button>
      </div>

      <div v-else class="device-grid">
        <div 
          v-for="device in devices" 
          :key="device.id" 
          class="device-card"
          @click="goToDetail(device.id)"
        >
          <div class="card-header">
            <h3>{{ device.nama_ruangan }}</h3>
            <div class="status-container">
              <span :class="['ac-status', device.status_ac === 'ON' ? 'status-on' : 'status-off']">
                {{ device.status_ac }}
              </span>
              <span v-if="device.status_ac === 'ON'" :class="['mode-ac-badge', device.mode_ac === 'TURBO' ? 'mode-turbo' : 'mode-normal']">
                {{ device.mode_ac }}
              </span>
            </div>
          </div>

          <div class="card-body">
            <div class="temp-display">
              <span class="temp-value">{{ device.suhu_aktual || '--' }}</span>
              <span class="temp-unit">°C</span>
            </div>
            
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Sistem Kontrol:</span>
                <span class="info-value">{{ device.mode_kontrol }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">ID Alat:</span>
                <span class="info-value">{{ device.device_id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Kehadiran:</span>
                <span :class="['info-value', device.status_kehadiran === 'Ada Orang' ? 'text-green' : 'text-gray']">
                  {{ device.status_kehadiran || 'Kosong' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const devices = ref([])
const isLoading = ref(true)
let pollingInterval = null 

// Fungsi Utama: Mengambil data LIVE dari Backend Express.js
const fetchDevices = async () => {
  try {
    // Memanggil API GET /api/devices
    const response = await axios.get('http://localhost:3000/api/devices')
    devices.value = response.data
    isLoading.value = false
  } catch (error) {
    console.error("Gagal mengambil data perangkat:", error)
    isLoading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/room/${id}`)
}

const goToAddDevice = () => {
  router.push('/add-device')
}

const goToHistory = () => {
  router.push('/history')
}

// Menjalankan fetch saat halaman dimuat, lalu me-refresh setiap 5 detik
onMounted(() => {
  fetchDevices()
  // Agar suhu realtime ESP32 terlihat update tanpa perlu refresh browser
  pollingInterval = setInterval(fetchDevices, 5000) 
})

onUnmounted(() => {
  // Bersihkan interval saat pindah halaman agar tidak bocor memory
  if (pollingInterval) clearInterval(pollingInterval)
})
</script>

<style scoped>
/* CO-PASTE SEMUA STYLE DARI KODE ANDA SEBELUMNYA DI SINI */
.dashboard-container { padding: 20px; background-color: #f4f7f6; min-height: 100vh; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.user-greeting h1 { font-size: 22px; font-weight: bold; margin: 0; color: #333; }
.user-greeting p { font-size: 13px; color: #777; margin: 5px 0 0 0; }
.header-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.btn-history { background: white; border: 1px solid #ddd; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: bold; color: #555; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 4px; }
.btn-history:active { transform: scale(0.95); }
.status-badge { display: flex; align-items: center; background: #e6f4ea; color: #28a745; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
.pulse { display: block; width: 8px; height: 8px; background: #28a745; border-radius: 50%; margin-right: 6px; box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); animation: pulse-green 2s infinite; }
@keyframes pulse-green { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(40, 167, 69, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); } }
.section-title { font-size: 18px; font-weight: 600; color: #444; margin-bottom: 15px; }
.device-grid { display: flex; flex-direction: column; gap: 15px; }
.device-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); transition: transform 0.2s; cursor: pointer; }
.device-card:active { transform: scale(0.98); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
.card-header h3 { margin: 0; font-size: 16px; color: #333; }
.ac-status { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; }
.status-on { background: #d4edda; color: #155724; }
.status-off { background: #f8d7da; color: #721c24; }
.card-body { display: flex; justify-content: space-between; align-items: center; }
.temp-display { display: flex; align-items: flex-start; color: #007bff; }
.temp-value { font-size: 36px; font-weight: bold; line-height: 1; }
.temp-unit { font-size: 16px; font-weight: bold; margin-top: 4px; }
.info-list { display: flex; flex-direction: column; gap: 5px; text-align: right; }
.info-item { font-size: 12px; }
.info-label { color: #888; margin-right: 5px; }
.info-value { color: #333; font-weight: 600; }
.empty-state, .loading-state { text-align: center; padding: 40px 20px; color: #777; }
.btn-outline { margin-top: 15px; padding: 10px 20px; border: 1px solid #007bff; color: #007bff; background: transparent; border-radius: 8px; font-weight: bold; cursor: pointer; }
.status-container { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.mode-ac-badge { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
.mode-turbo { background: #cce5ff; color: #004085; border: 1px solid #b8daff; }
.mode-normal { background: #e2e3e5; color: #383d41; border: 1px solid #d6d8db; }
.text-green { color: #28a745; }
.text-gray { color: #6c757d; }
</style>