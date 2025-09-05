<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: 'Are you sure you want to leave this page?',
  },
  message: {
    type: String,
    default: 'You have unsaved changes. If you leave now, your information will not be saved.',
  },
  confirmText: {
    type: String,
    default: 'Leave',
  },
  cancelText: {
    type: String,
    default: 'Stay',
  },
});

defineEmits(['confirm', 'cancel']);
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-box">
      <h2 class="modal-title">{{ title }}</h2>
      <p class="modal-message">{{ message }}</p>
      <div class="modal-buttons">
        <button @click="$emit('cancel')" class="btn cancel">{{ cancelText }}</button>
        <button @click="$emit('confirm')" class="btn confirm">{{ confirmText }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Your existing styles remain unchanged */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(1px);
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
  gap: 16px;
  padding-right: 8px;
}

.btn {
  font-weight: bold;
  padding: 3px 14px;
  border-radius: 9999px;
  border: 2px solid #57c490;
  font-size: 0.9rem;
  min-width: 70px;
  transition: all 0.2s ease;
}

.cancel {
  background-color: white;
  color: #57c490;
}

.cancel:hover {
  background-color: #f0fef8;
}

.confirm {
  background-color: #57c490;
  color: white;
}

.confirm:hover {
  background-color: #49b07f;
}
</style>
