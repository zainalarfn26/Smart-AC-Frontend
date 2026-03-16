<template>
  <div class="p-4">
    <h2>Tambah Perangkat AC Baru</h2>
    <p class="subtitle">Daftarkan ESP32 dan Radar baru ke dalam sistem.</p>

    <form @submit.prevent="submitDevice" class="form-card">
      <div class="input-group">
        <label>Nama Ruangan</label>
        <input v-model="form.nama" type="text" placeholder="Contoh: Ruang Dosen 1" required />
      </div>

      <div class="input-group">
        <label>ID Perangkat (Device ID)</label>
        <input v-model="form.device_id" type="text" placeholder="Contoh: ESP32-DOSEN-01" required />
        <small>ID ini harus sama dengan topik MQTT di kode Arduino.</small>
      </div>

      <div class="input-group">
        <label>Merk AC</label>
        <select v-model="form.merk_ac" required>
          <option value="DAIKIN">Daikin</option>
          <option value="PANASONIC">Panasonic</option>
          <option value="SHARP">Sharp</option>
          <option value="SAMSUNG">Samsung</option>
          <option value="LG">LG</option>
        </select>
        <small>Pilih merk AC agar sinyal Infrared dapat diterjemahkan dengan tepat.</small>
      </div>

      <div class="input-group">
        <label>Batas Suhu Atas (°C) / Hysteresis Turbo</label>
        <input v-model="form.batas_atas" type="number" step="0.1" placeholder="Contoh: 28" required />
      </div>

      <div class="input-group">
        <label>Batas Suhu Bawah (°C) / Hysteresis Normal</label>
        <input v-model="form.batas_bawah" type="number" step="0.1" placeholder="Contoh: 24" required />
      </div>

      <button type="submit" class="btn-submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perangkat' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const router = useRouter()
const isSubmitting = ref(false)

const form = reactive({
  nama: '',
  device_id: '',
  merk_ac: 'DAIKIN',
  batas_atas: 28.0,
  batas_bawah: 24.0
})

const submitDevice = async () => {
  if(isSubmitting.value) return
  isSubmitting.value = true

  try {
    await axios.post('http://localhost:3000/api/devices', form)
    
    toast.success('Perangkat berhasil ditambahkan!', {
      autoClose: 2000,
      position: toast.POSITION.BOTTOM_RIGHT,
    })
    
    setTimeout(() => {
      router.push('/')
    }, 2000)

  } catch (error) {
    console.error(error)
    toast.error('Gagal menambahkan perangkat. Cek koneksi backend.', {
      autoClose: 3000,
      position: toast.POSITION.BOTTOM_RIGHT,
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.p-4 { padding: 20px; background-color: #f4f7f6; min-height: 100vh;}
h2 { color: #333; margin-bottom: 5px; }
.subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
.form-card { background: white; padding: 20px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
.input-group { margin-bottom: 15px; display: flex; flex-direction: column; }
.input-group label { font-weight: bold; margin-bottom: 5px; font-size: 14px; color: #555;}
.input-group input, 
.input-group select { /* Tambahan style untuk select agar seragam dengan input */
  padding: 12px; 
  border: 1px solid #ddd; 
  border-radius: 8px; 
  outline: none; 
  font-size: 14px; 
  font-family: inherit;
}
.input-group select { background-color: white; cursor: pointer; }
.input-group input:focus,
.input-group select:focus { border-color: #007bff; }
.input-group small { color: #888; font-size: 11px; margin-top: 6px; }
.btn-submit { background: #007bff; color: white; border: none; padding: 15px; border-radius: 8px; width: 100%; font-weight: bold; font-size: 16px; cursor: pointer; transition: 0.2s;}
.btn-submit:disabled { background: #a0cbfc; cursor: not-allowed; }
</style>