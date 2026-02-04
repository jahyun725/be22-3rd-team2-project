<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '확인',
  },
  message: {
    type: String,
    required: true,
  },
  confirmText: {
    type: String,
    default: '확인',
  },
  cancelText: {
    type: String,
    default: '취소',
  },
  type: {
    type: String,
    default: 'primary', // primary | danger
  }
});

const emit = defineEmits(['close', 'confirm']);
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div class="w-full max-w-sm rounded-lg bg-white shadow-xl border border-gray-200">
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-base font-semibold text-gray-900">{{ title }}</h3>
      </div>
      <div class="p-5">
        <p class="text-sm text-gray-700 whitespace-pre-line">{{ message }}</p>
      </div>
      <div class="p-4 border-t border-gray-200 flex justify-end gap-3">
        <button
          class="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          @click="emit('close')"
        >
          {{ cancelText }}
        </button>
        <button
          class="px-4 py-2 text-white rounded-lg transition-colors"
          :class="type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>
