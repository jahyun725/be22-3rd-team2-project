<script setup>
import { ref, computed, watch } from 'vue';
import { X, Save } from 'lucide-vue-next';
const props = defineProps({
  board: {
    type: Object,
    default: null,
  },
  isOpen: {
    type: Boolean,
    required: true,
  },
  isNewBoard: {
    type: Boolean,
    default: false,
  },
  availableUsers: {
    type: Array,
    required: true,
  },
  currentUserEmail: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['close', 'save']);

const boardColors = [
  'bg-blue-600',
  'bg-purple-600',
  'bg-green-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-indigo-600',
  'bg-red-600',
  'bg-teal-600',
];

const formData = ref({
  id: '',
  title: '',
  description: '',
  color: 'bg-blue-600',
  createdAt: new Date(),
  updatedAt: new Date(),
  memberCount: 0,
  unassignedCount: 0,
  taskCount: 0,
  members: [],
  createdBy: '',
});

const selectedMembers = ref([]);

// 현재 사용자를 제외한 팀원 목록
const invitableUsers = computed(() =>
  props.availableUsers.filter((user) => user.email !== props.currentUserEmail)
);

// 모달이 열릴 때마다 폼 데이터 초기화
watch(
  () => props.isOpen,
  (newVal) => {
  if (newVal) {
    if (props.board) {
      formData.value = { ...props.board };
      selectedMembers.value = props.board.members?.map((m) => m.email) || [];
    } else {
      // 새 보드인 경우 초기화
      formData.value = {
        id: '',
        title: '',
        description: '',
        color: 'bg-blue-600',
        createdAt: new Date(),
        updatedAt: new Date(),
        memberCount: 0,
        unassignedCount: 0,
        taskCount: 0,
        members: [],
        createdBy: '',
      };
      selectedMembers.value = [];
    }
  }
  }
);

const toggleMember = (email) => {
  if (selectedMembers.value.includes(email)) {
    selectedMembers.value = selectedMembers.value.filter((e) => e !== email);
  } else {
    selectedMembers.value = [...selectedMembers.value, email];
  }
};

  const showTitleError = ref(false);

  const handleSave = () => {
    if (!formData.value.title.trim()) {
      showTitleError.value = true;
      return;
    }
    showTitleError.value = false;
    
    // 생성자를 selectedMembers에 자동으로 포함 (중복 체크)
    const membersToInclude = selectedMembers.value.includes(props.currentUserEmail)
      ? selectedMembers.value
      : [props.currentUserEmail, ...selectedMembers.value];
    
    // 선택된 멤버를 BoardMember 형식으로 변환
    const members = membersToInclude
      .map((email) => {
        const user = props.availableUsers.find((u) => u.email === email);
        if (!user) return null;
        
        return {
          id: `member${Date.now()}_${email}`,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: email === props.currentUserEmail ? 'owner' : 'member',
          addedAt: new Date(),
        };
      })
      .filter(Boolean);
    
    emit('save', {
      ...formData.value,
      members,
      memberCount: members.length,
      updatedAt: new Date(),
    });
  };
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div class="border-b border-gray-200 p-4 flex items-center justify-between">
        <h2 class="font-semibold text-gray-900">
          {{ isNewBoard ? '새 보드 만들기' : '보드 수정' }}
        </h2>
        <button
          @click="emit('close')"
          class="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X class="size-5 text-gray-500" />
        </button>
      </div>

      <div class="p-6 space-y-4">
        <div>
          <label for="title" class="block text-sm font-medium text-gray-900 mb-1.5">보드 제목 *</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            placeholder="제목을 입력하세요"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            :class="showTitleError ? 'border-red-500 focus:ring-red-200' : 'border-gray-200'"
            @input="showTitleError = false"
          />
          <p v-if="showTitleError" class="text-sm text-red-500 mt-1">보드 제목을 입력해주세요.</p>
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-900 mb-1.5">설명</label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="보드에 대한 간단한 설명을 입력하세요"
            rows="3"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">보드 색상</label>
          <div class="grid grid-cols-8 gap-2">
            <button
              v-for="color in boardColors"
              :key="color"
              @click="formData.color = color"
              :class="`size-10 rounded-lg ${color} ${
                formData.color === color
                  ? 'ring-2 ring-offset-2 ring-blue-500'
                  : 'hover:scale-110'
              } transition-all`"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-900 mb-2">팀원 초대</label>
          <div class="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
            <div
              v-for="user in invitableUsers"
              :key="user.email"
              @click="toggleMember(user.email)"
              :class="`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedMembers.includes(user.email) ? 'bg-blue-50' : ''
              }`"
            >
              <div :class="`size-5 rounded border-2 flex items-center justify-center ${
                selectedMembers.includes(user.email) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              }`">
                <svg
                  v-if="selectedMembers.includes(user.email)"
                  class="size-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <img :src="user.avatar" :alt="user.name" class="size-10 rounded-full" />
              <div class="flex-1">
                <p class="font-medium text-gray-900">{{ user.name }}</p>
                <p class="text-sm text-gray-600">{{ user.email }}</p>
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-600 mt-2">{{ selectedMembers.length }}명 선택됨</p>
        </div>
      </div>

      <div class="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-2">
        <button
          @click="emit('close')"
          class="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          @click="handleSave"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save class="size-4" />
          {{ isNewBoard ? '생성하기' : '저장' }}
        </button>
      </div>
    </div>
  </div>
</template>
