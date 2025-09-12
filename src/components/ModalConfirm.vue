<script setup lang="ts">
import { reactive } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Are you sure you want to leave this page?' },
  message: {
    type: String,
    default: 'You have unsaved changes. If you leave now, your information will not be saved.',
  },
  confirmText: { type: String, default: 'Leave' },
  cancelText: { type: String, default: 'Stay' },
  confirmColor: { type: String, default: '#57c490' },
  confirmHoverColor: { type: String, default: '#49b07f' },
  cancelColor: { type: String, default: '#ffffff' },
  cancelTextColor: { type: String, default: '#57c490' },
  cancelHoverColor: { type: String, default: '#f0fef8' },
})

defineEmits(['confirm', 'cancel'])

// Reactive style objects
const confirmStyle = reactive({
  backgroundColor: props.confirmColor,
  borderColor: props.confirmColor,
  color: 'white',
})

const cancelStyle = reactive({
  backgroundColor: props.cancelColor,
  borderColor: props.cancelColor,
  color: props.cancelTextColor,
})

// Hover methods
function onConfirmHover() {
  confirmStyle.backgroundColor = props.confirmHoverColor
  confirmStyle.borderColor = props.confirmHoverColor
}

function onConfirmLeave() {
  confirmStyle.backgroundColor = props.confirmColor
  confirmStyle.borderColor = props.confirmColor
}

function onCancelHover() {
  cancelStyle.backgroundColor = props.cancelHoverColor
  cancelStyle.borderColor = props.cancelHoverColor
}

function onCancelLeave() {
  cancelStyle.backgroundColor = props.cancelColor
  cancelStyle.borderColor = props.cancelColor
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-box">
      <h2 class="modal-title">{{ title }}</h2>
      <p class="modal-message">{{ message }}</p>
      <div class="modal-buttons">
        <button
          @click="$emit('cancel')"
          class="btn cancel"
          :style="cancelStyle"
          @mouseover="onCancelHover"
          @mouseleave="onCancelLeave"
        >
          {{ cancelText }}
        </button>

        <button
          @click="$emit('confirm')"
          class="btn confirm"
          :style="confirmStyle"
          @mouseover="onConfirmHover"
          @mouseleave="onConfirmLeave"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  border: 2px solid;
  font-size: 0.9rem;
  min-width: 70px;
  transition: all 0.2s ease;
  cursor: pointer;
}
</style>
