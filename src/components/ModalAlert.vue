<template>
  <div class="modal-overlay">
    <div class="modal-box">
      <h2 class="modal-title">{{ title }}</h2>
      <p class="modal-message">{{ message }}</p>
      <div class="modal-buttons">
        <button @click="$emit('close')" class="btn confirm">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()

defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background-color: #fff;
  padding: 28px;
  border-radius: 16px;
  box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.15);
  width: 440px;
  max-width: 90%;
  text-align: left;
}

.modal-title {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 12px;
  color: #333;
  padding-left: 8px;
}

.modal-message {
  color: #555;
  font-size: 0.95rem;
  margin-bottom: 20px;
  padding-left: 8px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  padding-right: 8px;
}

/* ปุ่มพื้นฐาน */
.btn {
  font-weight: bold;
  padding: 3px 14px;
  border-radius: 9999px;
  border: 2px solid #57c490;
  font-size: 0.9rem;
  min-width: 70px;
  transition: all 0.2s ease;
}

/* ปุ่ม OK = ปุ่ม Leave */
.confirm {
  background-color: #57c490;
  color: white;
}

.confirm:hover {
  background-color: #49b07f;
}
</style>
