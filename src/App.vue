<template>
  <div class="mobile-app-container">
    <main class="main-content">
      <RouterView />
    </main>

    <nav class="bottom-nav">
      <RouterLink to="/" class="nav-item">
        <span class="icon">🏠</span>
        <span class="text">Beranda</span>
      </RouterLink>
      
      <RouterLink to="/add-device" class="nav-item">
        <span class="icon">➕</span>
        <span class="text">Tambah</span>
      </RouterLink>

      <RouterLink to="/history" class="nav-item">
        <span class="icon">📋</span>
        <span class="text">Riwayat</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.mobile-app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f7f6;
}
.main-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 70px; /* Space untuk bottom nav */
}
.bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 65px;
  background: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #888;
  font-size: 12px;
}
.nav-item.router-link-exact-active {
  color: #007bff; /* Warna aktif */
  font-weight: bold;
}
.icon { font-size: 24px; margin-bottom: 4px; }
</style>