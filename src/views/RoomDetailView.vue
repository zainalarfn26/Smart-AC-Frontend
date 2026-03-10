<template>
  <div class="detail-container">
    <header class="header">
      <button @click="goBack" class="btn-back">
        <span>← Kembali</span>
      </button>
      <h2>Kontrol AC</h2>
      <div style="width: 70px;"></div>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>Mengambil data ruangan...</p>
    </div>

    <div v-else-if="device" class="content">
      <div class="room-title">
        <h1>{{ device.nama_ruangan }}</h1>
        <p class="device-id">{{ device.device_id }}</p>
      </div>

      <div class="presence-indicator">
        <span class="icon">👤</span>
        Status Ruangan: 
        <strong :class="device.status_kehadiran === 'Ada Orang' ? 'text-green' : 'text-gray'">
          {{ device.status_kehadiran || 'Kosong' }}
        </strong>
      </div>

      <div class="temp-circle" :class="{'is-off': device.status_ac === 'OFF'}">
        <span class="temp-label">Suhu Aktual</span>
        <div class="temp-value">
          {{ device.suhu_aktual || '--' }}<span class="temp-unit">°C</span>
        </div>
        <span class="ac-status-text">
          {{ device.status_ac === 'ON' ? 'Menyala' : 'Mati' }}
        </span>
        <span v-if="device.status_ac === 'ON'" class="ac-mode-text">
          Mode: {{ device.mode_ac }}
        </span>
      </div>

      <div class="control-group">
        <h3>Sistem Kontrol</h3>
        <p class="info-text">Pilih bagaimana sistem AC dikendalikan.</p>
        <div class="toggle-mode">
          <button 
            :class="{'active': device.mode_kontrol === 'AUTO'}" 
            @click="setModeKontrol('AUTO')"
          >Otomatis (Radar + Hysteresis)</button>
          <button 
            :class="{'active': device.mode_kontrol === 'MANUAL'}" 
            @click="setModeKontrol('MANUAL')"
          >Manual (Aplikasi)</button>
        </div>
      </div>

      <div class="control-group manual-controls" :class="{'disabled': device.mode_kontrol === 'AUTO'}">
        <h3>Kontrol Manual</h3>
        
        <div class="power-control">
          <button 
            class="btn-power" 
            :class="{'power-on': device.status_ac === 'ON'}"
            @click="togglePower"
            :disabled="device.mode_kontrol === 'AUTO' || isActionLoading"
          >
            {{ isActionLoading ? 'Memproses...' : (device.status_ac === 'ON' ? 'Matikan AC' : 'Nyalakan AC') }}
          </button>
        </div>

        <div class="mode-ac-control" :class="{'disabled': device.status_ac === 'OFF'}">
          <h4>Mode Pendinginan</h4>
          <div class="toggle-mode">
            <button 
              :class="{'active-turbo': device.mode_ac === 'TURBO'}" 
              @click="setModeAC('TURBO')"
              :disabled="device.mode_kontrol === 'AUTO' || device.status_ac === 'OFF' || isActionLoading"
            >❄️ TURBO</button>
            <button 
              :class="{'active-normal': device.mode_ac === 'NORMAL'}" 
              @click="setModeAC('NORMAL')"
              :disabled="device.mode_kontrol === 'AUTO' || device.status_ac === 'OFF' || isActionLoading"
            >🍃 NORMAL</button>
          </div>
        </div>
      </div>

      <div class="control-group info-group">
        <h3>Parameter Hysteresis</h3>
        <div class="hysteresis-info">
          <div class="info-box">
            <span class="label">Batas Bawah (Normal)</span>
            <span class="value">{{ device.batas_bawah }}°C</span>
          </div>
          <div class="info-box">
            <span class="label">Batas Atas (Turbo)</span>
            <span class="value">{{ device.batas_atas }}°C</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const device = ref(null)
const isLoading = ref(true)
const isActionLoading = ref(false) // Mencegah spam klik tombol
let pollingInterval = null

const roomId = route.params.id

// Mengambil Data Detail LIVE
const fetchRoomDetail = async () => {
  try {
    const response = await axios.get(`http://localhost:3000/api/devices/${roomId}`)
    device.value = response.data
    isLoading.value = false
  } catch (error) {
    console.error("Gagal mengambil data:", error)
    isLoading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

// Menembak API Kontrol (Auto/Manual)
const setModeKontrol = async (mode) => {
  if (device.value.mode_kontrol === mode) return
  
  // Optimistic UI Update (Ganti tampilan langsung agar terasa cepat)
  const previousMode = device.value.mode_kontrol
  device.value.mode_kontrol = mode
  
  try {
    await axios.post(`http://localhost:3000/api/devices/${roomId}/mode`, { mode })
  } catch (error) {
    console.error("Gagal mengubah mode:", error)
    device.value.mode_kontrol = previousMode // Revert jika gagal
    alert("Gagal menghubungi server")
  }
}

// Menembak API Power ON/OFF
const togglePower = async () => {
  if (isActionLoading.value) return
  isActionLoading.value = true

  const newStatus = device.value.status_ac === 'ON' ? 'OFF' : 'ON'
  const previousStatus = device.value.status_ac
  const previousModeAC = device.value.mode_ac

  device.value.status_ac = newStatus
  if(newStatus === 'OFF') device.value.mode_ac = 'NORMAL' 

  try {
    await axios.post(`http://localhost:3000/api/devices/${roomId}/power`, { status: newStatus })
  } catch (error) {
    console.error("Gagal mengontrol power:", error)
    device.value.status_ac = previousStatus // Revert
    device.value.mode_ac = previousModeAC
    alert("Gagal mengeksekusi perintah")
  } finally {
    isActionLoading.value = false
  }
}

// Menembak API Mode AC (Turbo/Normal)
const setModeAC = async (mode_ac) => {
  if (device.value.mode_ac === mode_ac || device.value.status_ac === 'OFF' || isActionLoading.value) return
  isActionLoading.value = true

  const previousMode = device.value.mode_ac
  device.value.mode_ac = mode_ac

  try {
    await axios.post(`http://localhost:3000/api/devices/${roomId}/mode-ac`, { mode_ac })
  } catch (error) {
    console.error("Gagal mengubah mode AC:", error)
    device.value.mode_ac = previousMode // Revert
    alert("Gagal mengeksekusi perintah")
  } finally {
    isActionLoading.value = false
  }
}

onMounted(() => {
  fetchRoomDetail()
  // Refresh data setiap 3 detik untuk memantau suhu realtime
  pollingInterval = setInterval(fetchRoomDetail, 3000)
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})
</script>

<style scoped>
/* CO-PASTE SEMUA STYLE DARI KODE ANDA SEBELUMNYA DI SINI */
.detail-container { padding: 20px; background-color: #f4f7f6; min-height: 100vh; padding-bottom: 90px;}
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header h2 { font-size: 18px; font-weight: 600; color: #333; margin: 0; }
.btn-back { background: none; border: none; font-size: 14px; color: #007bff; font-weight: bold; cursor: pointer; padding: 0; }
.room-title { text-align: center; margin-bottom: 15px; }
.room-title h1 { font-size: 24px; margin: 0; color: #222; }
.device-id { font-size: 12px; color: #888; margin-top: 5px; }
.presence-indicator { background: white; padding: 10px 15px; border-radius: 12px; text-align: center; font-size: 14px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
.text-green { color: #28a745; }
.text-gray { color: #888; }
.temp-circle { width: 220px; height: 220px; border-radius: 50%; background: linear-gradient(145deg, #007bff, #00d2ff); margin: 0 auto 30px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; box-shadow: 0 10px 20px rgba(0, 123, 255, 0.3); transition: all 0.3s ease;}
.temp-circle.is-off { background: linear-gradient(145deg, #a8b8c8, #cbd5e1); box-shadow: 0 10px 20px rgba(168, 184, 200, 0.3); }
.temp-label { font-size: 14px; opacity: 0.8; margin-bottom: 5px; }
.temp-value { font-size: 64px; font-weight: bold; line-height: 1; }
.temp-unit { font-size: 24px; font-weight: normal; vertical-align: super; }
.ac-status-text { font-size: 16px; font-weight: bold; margin-top: 10px; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; }
.ac-mode-text { font-size: 12px; margin-top: 5px; opacity: 0.9; text-transform: uppercase; font-weight: 600; }
.control-group { background: white; border-radius: 16px; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
.control-group h3 { font-size: 14px; color: #555; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; }
.info-text { font-size: 12px; color: #888; margin-bottom: 15px; }
.toggle-mode { display: flex; background: #f0f0f0; border-radius: 10px; overflow: hidden; margin-top: 10px; }
.toggle-mode button { flex: 1; padding: 12px; border: none; background: none; font-weight: bold; color: #777; cursor: pointer; transition: 0.2s; font-size: 13px;}
.toggle-mode button.active { background: #007bff; color: white; border-radius: 10px; }
.toggle-mode button.active-turbo { background: #004085; color: white; border-radius: 10px; }
.toggle-mode button.active-normal { background: #17a2b8; color: white; border-radius: 10px; }
.manual-controls { transition: opacity 0.3s; }
.manual-controls.disabled, .mode-ac-control.disabled { opacity: 0.4; pointer-events: none; }
.btn-power { width: 100%; padding: 15px; border-radius: 10px; border: none; font-size: 16px; font-weight: bold; cursor: pointer; background: #f8d7da; color: #721c24; margin-bottom: 15px; transition: 0.2s; }
.btn-power:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-power.power-on { background: #d4edda; color: #155724; }
.mode-ac-control h4 { font-size: 13px; color: #666; margin: 15px 0 5px 0;}
.info-group { background: #f8f9fa; }
.hysteresis-info { display: flex; gap: 10px; margin-top: 10px; }
.info-box { flex: 1; background: white; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #e9ecef; }
.info-box .label { display: block; font-size: 11px; color: #777; margin-bottom: 5px; }
.info-box .value { display: block; font-size: 18px; font-weight: bold; color: #333; }
.loading-state { text-align: center; padding: 50px; color: #888; }
</style>