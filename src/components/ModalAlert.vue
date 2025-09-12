<template>
  <div class="modal-overlay">
    <div class="modal-box" :class="boxClass">
      <h2 class="modal-title">{{ title }}</h2>
      <p class="modal-message">{{ message }}</p>
      <div class="modal-buttons">
        <button @click="$emit('close')" class="btn" :class="btnClass">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
}>()

defineEmits(['close'])

const btnClass = computed(() => {
  switch (props.type) {
    case 'error':
      return 'btn-error'
    case 'warning':
      return 'btn-warning'
    case 'info':
      return 'btn-info'
    default:
      return 'btn-success'
  }
})

const boxClass = computed(() => {
  switch (props.type) {
    case 'error':
      return 'box-error'
    case 'warning':
      return 'box-warning'
    case 'info':
      return 'box-info'
    default:
      return 'box-success'
  }
})
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
  border-left: 6px solid transparent;
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

/* ===== Button styles ===== */
.btn {
  font-weight: bold;
  padding: 3px 14px;
  border-radius: 9999px;
  font-size: 0.9rem;
  min-width: 70px;
  transition: all 0.2s ease;
}

/* Success */
.btn-success {
  background-color: #57c490;
  border: 2px solid #57c490;
  color: white;
}
.btn-success:hover {
  background-color: #49b07f;
}
.box-success {
  border-left-color: #57c490;
}

/* Error */
.btn-error {
  background-color: #e74c3c;
  border: 2px solid #e74c3c;
  color: white;
}
.btn-error:hover {
  background-color: #c0392b;
}
.box-error {
  border-left-color: #e74c3c;
}

/* Warning */
.btn-warning {
  background-color: #f39c12;
  border: 2px solid #f39c12;
  color: white;
}
.btn-warning:hover {
  background-color: #d68910;
}
.box-warning {
  border-left-color: #f39c12;
}

/* Info */
.btn-info {
  background-color: #3498db;
  border: 2px solid #3498db;
  color: white;
}
.btn-info:hover {
  background-color: #2e86c1;
}
.box-info {
  border-left-color: #3498db;
}
</style>
