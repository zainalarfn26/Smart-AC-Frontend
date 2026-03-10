<template>
  <div class="history-container">
    <header class="header">
      <button @click="goBack" class="btn-back">
        <span>← Kembali ke Dashboard</span>
      </button>
      <h2>Riwayat Aktuasi AC</h2>
      <p>Catatan aktivitas perangkat seluruh ruangan.</p>
    </header>

    <div v-if="isLoading" class="loading-state">
      <p>Memuat data riwayat...</p>
    </div>

    <div v-else-if="logs.length === 0" class="empty-state">
      <p>Belum ada riwayat aktivitas AC.</p>
    </div>

    <div v-else class="log-list">
      <div v-for="log in logs" :key="log.id" class="log-card">
        <div class="log-icon" :class="getIconClass(log.action)">
          {{ getIconSymbol(log.action) }}
        </div>
        
        <div class="log-content">
          <div class="log-header">
            <h4>{{ log.nama_ruangan }}</h4>
            <span class="log-time">{{ formatTime(log.waktu) }}</span>
          </div>
          <div class="log-details">
            <p><strong>Aksi:</strong> <span :class="getTextClass(log.action)">{{ formatActionText(log.action) }}</span></p>
            <p><strong>Pemicu:</strong> {{ log.pemicu }} <span v-if="log.suhu_tercatat > 0">(Suhu: {{ log.suhu_tercatat }}°C)</span></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const logs = ref([])
const isLoading = ref(true)

// Mengambil Data LIVE History dari Database
const fetchHistory = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/history')
    logs.value = response.data
    isLoading.value = false
  } catch (error) {
    console.error("Gagal mengambil riwayat:", error)
    isLoading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

const formatTime = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
}

// Fungsi Helper (Sama seperti sebelumnya)
const getIconClass = (action) => {
  if (action === 'ON') return 'bg-green'
  if (action === 'OFF') return 'bg-red'
  if (action.includes('TURBO')) return 'bg-blue' 
  return 'bg-cyan' 
}

const getIconSymbol = (action) => {
  if (action === 'ON') return '⚡'
  if (action === 'OFF') return '🛑'
  if (action.includes('TURBO')) return '❄️'
  return '🍃'
}

const getTextClass = (action) => {
  if (action === 'ON') return 'text-green'
  if (action === 'OFF') return 'text-red'
  if (action.includes('TURBO')) return 'text-blue'
  return 'text-cyan'
}

const formatActionText = (action) => {
  if (action === 'ON') return 'Menyalakan AC'
  if (action === 'OFF') return 'Mematikan AC'
  return `Ubah Mode ke ${action.replace('MODE ', '')}`
}

onMounted(() => {
  fetchHistory()
})
</script>

<style scoped>
/* CO-PASTE STYLE ANDA DI SINI */
.history-container { padding: 20px; background-color: #f4f7f6; min-height: 100vh; padding-bottom: 90px; }
.header { margin-bottom: 20px; }
.btn-back { background: none; border: none; font-size: 13px; color: #007bff; font-weight: bold; cursor: pointer; padding: 0; margin-bottom: 10px; display: inline-block;}
.header h2 { font-size: 22px; margin: 0; color: #333; }
.header p { font-size: 13px; color: #777; margin-top: 5px; }
.log-list { display: flex; flex-direction: column; gap: 12px; }
.log-card { display: flex; background: white; padding: 15px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); align-items: flex-start;}
.log-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 18px; margin-right: 15px; flex-shrink: 0; }
.bg-green { background-color: #d4edda; }
.bg-red { background-color: #f8d7da; }
.bg-blue { background-color: #cce5ff; } 
.bg-cyan { background-color: #e0f7fa; } 
.text-green { color: #28a745; font-weight: bold;}
.text-red { color: #dc3545; font-weight: bold;}
.text-blue { color: #0056b3; font-weight: bold;}
.text-cyan { color: #00838f; font-weight: bold;}
.log-content { flex: 1; }
.log-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.log-header h4 { margin: 0; font-size: 15px; color: #222; }
.log-time { font-size: 11px; color: #888; background: #eee; padding: 2px 6px; border-radius: 4px;}
.log-details p { margin: 0; font-size: 12px; color: #555; line-height: 1.5; }
.loading-state, .empty-state { text-align: center; padding: 40px; color: #888; }
</style>