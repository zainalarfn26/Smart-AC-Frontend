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

      <div class="control-group settings-group">
        <div class="settings-header">
          <h3>⚙️ Pengaturan Perangkat</h3>
          <button @click="toggleEdit" class="btn-edit">
            {{ isEditing ? 'Batal' : 'Edit' }}
          </button>
        </div>
        
        <form v-if="isEditing" @submit.prevent="saveSettings" class="settings-form">
          <div class="input-group">
            <label>Merk AC (Untuk Sinyal IR)</label>
            <select v-model="editForm.merk_ac">
              <option value="DAIKIN">Daikin</option>
              <option value="PANASONIC">Panasonic</option>
              <option value="SHARP">Sharp</option>
              <option value="SAMSUNG">Samsung</option>
              <option value="LG">LG</option>
            </select>
          </div>
          <div class="row-inputs">
            <div class="input-group">
              <label>Batas Atas (°C)</label>
              <input type="number" step="0.1" v-model="editForm.batas_atas" />
            </div>
            <div class="input-group">
              <label>Batas Bawah (°C)</label>
              <input type="number" step="0.1" v-model="editForm.batas_bawah" />
            </div>
          </div>
          <button type="submit" class="btn-save" :disabled="isSavingSettings">
            {{ isSavingSettings ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </form>

        <div v-else class="settings-display">
          <div class="info-box">
            <span class="label">Merk AC</span>
            <span class="value">{{ device.merk_ac || 'Belum Diatur' }}</span>
          </div>
          <div class="hysteresis-info">
            <div class="info-box">
              <span class="label">Bawah (Normal)</span>
              <span class="value">{{ device.batas_bawah }}°C</span>
            </div>
            <div class="info-box">
              <span class="label">Atas (Turbo)</span>
              <span class="value">{{ device.batas_atas }}°C</span>
            </div>
          </div>
        </div>

        <div class="danger-zone" v-if="!isEditing">
          <button @click="confirmDelete" class="btn-delete"> Hapus Ruangan</button>
        </div>
      </div>

      <div v-if="showDeleteModal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-icon">⚠️</div>
          <h3>Hapus Ruangan?</h3>
          <p>Apakah Anda yakin ingin menghapus <strong>{{ device?.nama_ruangan }}</strong>? Semua riwayat log untuk ruangan ini juga akan ikut terhapus permanen.</p>
          <div class="modal-actions">
            <button @click="cancelDelete" class="btn-cancel">Batal</button>
            <button @click="executeDelete" class="btn-confirm-delete">Ya, Hapus!</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const route = useRoute()
const router = useRouter()

const device = ref(null)
const isLoading = ref(true)
const isActionLoading = ref(false) 
let pollingInterval = null

// --- State untuk fitur Edit Pengaturan ---
const isEditing = ref(false)
const isSavingSettings = ref(false)
const editForm = reactive({
  merk_ac: '',
  batas_atas: 0,
  batas_bawah: 0
})

// --- State untuk Modal Hapus ---
const showDeleteModal = ref(false)

const roomId = route.params.id

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

const setModeKontrol = async (mode) => {
  if (device.value.mode_kontrol === mode) return
  
  const previousMode = device.value.mode_kontrol
  device.value.mode_kontrol = mode
  
  try {
    await axios.post(`http://localhost:3000/api/devices/${roomId}/mode`, { mode })
    toast.info(`Sistem diubah ke mode ${mode}`, { autoClose: 1500, position: toast.POSITION.BOTTOM_RIGHT })
  } catch (error) {
    device.value.mode_kontrol = previousMode 
    toast.error("Gagal mengubah mode sistem", { position: toast.POSITION.BOTTOM_RIGHT })
  }
}

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
    toast.success(`AC berhasil di-${newStatus}-kan`, { autoClose: 1500, position: toast.POSITION.BOTTOM_RIGHT })
  } catch (error) {
    device.value.status_ac = previousStatus 
    device.value.mode_ac = previousModeAC
    toast.error("Gagal mengeksekusi perintah AC", { position: toast.POSITION.BOTTOM_RIGHT })
  } finally {
    isActionLoading.value = false
  }
}

const setModeAC = async (mode_ac) => {
  if (device.value.mode_ac === mode_ac || device.value.status_ac === 'OFF' || isActionLoading.value) return
  isActionLoading.value = true

  const previousMode = device.value.mode_ac
  device.value.mode_ac = mode_ac

  try {
    await axios.post(`http://localhost:3000/api/devices/${roomId}/mode-ac`, { mode_ac })
    toast.success(`Mode AC diubah menjadi ${mode_ac}`, { autoClose: 1500, position: toast.POSITION.BOTTOM_RIGHT })
  } catch (error) {
    device.value.mode_ac = previousMode 
    toast.error("Gagal mengeksekusi perintah mode", { position: toast.POSITION.BOTTOM_RIGHT })
  } finally {
    isActionLoading.value = false
  }
}

const toggleEdit = () => {
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    editForm.merk_ac = device.value.merk_ac || 'DAIKIN'
    editForm.batas_atas = device.value.batas_atas
    editForm.batas_bawah = device.value.batas_bawah
  }
}

const saveSettings = async () => {
  if (isSavingSettings.value) return
  isSavingSettings.value = true

  try {
    await axios.put(`http://localhost:3000/api/devices/${roomId}`, editForm)
    device.value.merk_ac = editForm.merk_ac
    device.value.batas_atas = editForm.batas_atas
    device.value.batas_bawah = editForm.batas_bawah
    
    isEditing.value = false
    toast.success('Pengaturan berhasil diperbarui!', { autoClose: 2000, position: toast.POSITION.BOTTOM_RIGHT })
  } catch (error) {
    console.error("Gagal menyimpan pengaturan:", error)
    toast.error("Gagal menyimpan pengaturan. Pastikan backend menyala.", { position: toast.POSITION.BOTTOM_RIGHT })
  } finally {
    isSavingSettings.value = false
  }
}

// --- Fungsi-fungsi untuk Modal Hapus ---
const confirmDelete = () => {
  showDeleteModal.value = true
}

const cancelDelete = () => {
  showDeleteModal.value = false
}

const executeDelete = async () => {
  showDeleteModal.value = false 
  
  try {
    await axios.delete(`http://localhost:3000/api/devices/${roomId}`)
    toast.success('Ruangan berhasil dihapus!', { autoClose: 2000, position: toast.POSITION.BOTTOM_RIGHT })
    
    setTimeout(() => {
      router.push('/')
    }, 1500)
    
  } catch (error) {
    console.error("Gagal menghapus ruangan:", error)
    toast.error("Gagal menghapus ruangan. Pastikan backend menyala.", { position: toast.POSITION.BOTTOM_RIGHT })
  }
}

onMounted(() => {
  fetchRoomDetail()
  pollingInterval = setInterval(fetchRoomDetail, 3000)
})

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})
</script>

<style scoped>
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

/* --- STYLE UNTUK PENGATURAN PERANGKAT --- */
.settings-group { background: #fcfcfc; border: 1px solid #eee; }
.settings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.btn-edit { background: none; border: 1px solid #007bff; color: #007bff; padding: 4px 12px; border-radius: 15px; font-size: 12px; cursor: pointer; font-weight: bold; }
.settings-display .info-box { background: white; padding: 12px; border-radius: 8px; border: 1px solid #eee; text-align: center; margin-bottom: 10px; }
.settings-display .label { display: block; font-size: 11px; color: #888; margin-bottom: 4px; }
.settings-display .value { display: block; font-size: 16px; font-weight: bold; color: #333; }
.hysteresis-info { display: flex; gap: 10px; }
.hysteresis-info .info-box { flex: 1; margin-bottom: 0; }

.settings-form { display: flex; flex-direction: column; gap: 12px; background: white; padding: 15px; border-radius: 10px; border: 1px solid #e0e0e0;}
.row-inputs { display: flex; gap: 10px; }
.row-inputs .input-group { flex: 1; }
.input-group label { display: block; font-size: 12px; font-weight: bold; color: #555; margin-bottom: 5px; }
.input-group input, .input-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-family: inherit; font-size: 13px;}
.btn-save { background: #28a745; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 5px;}
.btn-save:disabled { background: #94d3a2; cursor: not-allowed; }
.loading-state { text-align: center; padding: 50px; color: #888; }

.danger-zone { margin-top: 15px; border-top: 1px dashed #ffcdd2; padding-top: 15px; }
.btn-delete { width: 100%; background: white; color: #dc3545; border: 1px solid #dc3545; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 13px;}
.btn-delete:hover { background: #dc3545; color: white; }

/* --- STYLE UNTUK CUSTOM MODAL HAPUS --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
}
.modal-card {
  background: white; padding: 25px; border-radius: 16px;
  width: 85%; max-width: 320px; text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  animation: slideUp 0.3s ease;
}
.modal-icon { font-size: 40px; margin-bottom: 10px; }
.modal-card h3 { margin: 0 0 10px 0; color: #333; font-size: 18px; }
.modal-card p { font-size: 13px; color: #666; margin-bottom: 20px; line-height: 1.5; }
.modal-actions { display: flex; gap: 10px; }
.btn-cancel { flex: 1; padding: 12px; background: #e9ecef; border: none; border-radius: 8px; color: #495057; font-weight: bold; cursor: pointer; transition: 0.2s;}
.btn-cancel:hover { background: #dde2e6; }
.btn-confirm-delete { flex: 1; padding: 12px; background: #dc3545; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(220, 53, 69, 0.3);}
.btn-confirm-delete:hover { background: #c82333; transform: translateY(-1px);}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>