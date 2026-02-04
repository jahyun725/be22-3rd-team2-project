<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router'; // Unused but good practice if needed for nav
import BoardCard from './BoardCard.vue';
import { useKanbanStore } from '../stores/kanbanStore';
import { Search, Plus, CheckSquare, Star } from 'lucide-vue-next';

const props = defineProps({
  viewType: {
    type: String,
    default: 'dashboard', // 'dashboard', 'myTasks', 'favorites'
  }
});

const emit = defineEmits(['boardClick', 'createBoard', 'taskClick']);

const store = useKanbanStore();
const { boards, tasks, registeredUsers, currentUser } = storeToRefs(store);

const searchQuery = ref('');

// 현재 뷰 타이틀 및 설명
const viewTitle = computed(() => {
  if (props.viewType === 'myTasks') return '나에게 할당된 업무';
  if (props.viewType === 'favorites') return '즐겨찾기 업무';
  return '대시보드';
});

const viewDescription = computed(() => {
  if (props.viewType === 'myTasks') return '내가 담당자로 지정된 모든 업무를 확인하세요';
  if (props.viewType === 'favorites') return '즐겨찾기로 설정한 중요한 업무들';
  return '모든 칸반 보드를 한눈에 관리하세요';
});

const searchPlaceholder = computed(() => {
  return props.viewType === 'dashboard' ? '보드 검색...' : '업무 검색...';
});

const accessibleBoards = computed(() =>
  boards.value.filter((board) => {
    const isCreator = board.createdBy === currentUser.value?.email;
    const isMember = board.members?.some((member) => member.email === currentUser.value?.email);
    return isCreator || isMember;
  })
);

const accessibleBoardIds = computed(() => new Set(accessibleBoards.value.map((board) => board.id)));

const filteredBoards = computed(() =>
  accessibleBoards.value.filter((board) =>
    board.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    board.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

const myTasks = computed(() =>
  tasks.value.filter(
    (task) =>
      accessibleBoardIds.value.has(task.boardId) &&
    task.assignees.includes(currentUser.value?.name)
  )
);

const filteredMyTasks = computed(() =>
  myTasks.value.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

const favoriteTasks = computed(() =>
  tasks.value.filter(
    (task) => accessibleBoardIds.value.has(task.boardId) && task.isFavorite
  )
);

const filteredFavoriteTasks = computed(() =>
  favoriteTasks.value.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High':
      return 'text-red-600 bg-red-50';
    case 'Medium':
      return 'text-yellow-600 bg-yellow-50';
    case 'Low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

const getColumnLabel = (column) => {
  switch (column) {
    case 'todo':
      return '할 일';
    case 'inProgress':
      return '진행 중';
    case 'done':
      return '완료';
    default:
      return column;
  }
};
</script>

<template>
  <div class="flex-1 h-screen overflow-y-auto bg-gray-50">
    <div class="max-w-6xl mx-auto p-8">
      <!-- 헤더 -->
      <div class="mb-8">
        <h1 class="font-bold text-gray-900 mb-2">{{ viewTitle }}</h1>
        <p class="text-gray-600">{{ viewDescription }}</p>
      </div>

      <!-- 검색 & 액션 버튼 -->
      <div class="flex items-center gap-3 mb-8">
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full pl-10 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          v-if="viewType === 'dashboard'"
          @click="emit('createBoard')"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus class="size-5" />
          새 보드
        </button>
      </div>

      <!-- 대시보드 뷰 - 모든 보드 -->
      <div v-if="viewType === 'dashboard'">
        <h2 class="font-semibold text-gray-900 mb-4">모든 보드</h2>
        
        <div v-if="filteredBoards.length === 0" class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div class="inline-flex items-center justify-center size-16 bg-gray-100 rounded-full mb-4">
            <Plus class="size-8 text-gray-400" />
          </div>
          <h3 class="font-medium text-gray-900 mb-2">새 보드 만들기</h3>
          <p class="text-gray-600 mb-4">
            첫 번째 보드를 만들어 업무 관리를 시작하세요
          </p>
          <button
            @click="emit('createBoard')"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus class="size-5" />
            새 보드 만들기
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BoardCard
            v-for="board in filteredBoards"
            :key="board.id"
            :board="board"
            :registered-users="registeredUsers"
            @click="emit('boardClick', board.id)"
          />
          
          <!-- 새 보드 추가 카드 -->
          <button
            @click="emit('createBoard')"
            class="bg-white rounded-lg border-2 border-dashed border-gray-300 p-5 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]"
          >
            <Plus class="size-8 text-gray-400" />
            <span class="text-sm font-medium text-gray-600">새 보드 만들기</span>
          </button>
        </div>
      </div>

      <!-- 나에게 할당된 업무 뷰 -->
      <div v-if="viewType === 'myTasks'">
        <h2 class="font-semibold text-gray-900 mb-4">
          내 업무 <span class="text-gray-500">({{ filteredMyTasks.length }}개)</span>
        </h2>
        
        <div v-if="filteredMyTasks.length === 0" class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div class="inline-flex items-center justify-center size-16 bg-gray-100 rounded-full mb-4">
            <CheckSquare class="size-8 text-gray-400" />
          </div>
          <h3 class="font-medium text-gray-900 mb-2">할당된 업무가 없습니다</h3>
          <p class="text-gray-600">
            현재 담당자로 지정된 업무가 없습니다
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="task in filteredMyTasks"
            :key="task.id"
            @click="emit('taskClick', task)"
            class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <Star v-if="task.isFavorite" class="size-4 text-yellow-500 fill-yellow-500" />
                  <h3 class="font-medium text-gray-900">{{ task.title }}</h3>
                </div>
                
                <p v-if="task.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
                  {{ task.description }}
                </p>
                
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- 보드 이름 -->
                  <span
                    v-if="boards.find(b => b.id === task.boardId)"
                    class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {{ boards.find(b => b.id === task.boardId)?.title }}
                  </span>
                  
                  <!-- 상태 -->
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    {{ getColumnLabel(task.column) }}
                  </span>
                  
                  <!-- 우선순위 -->
                  <span :class="`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`">
                    {{ task.priority === 'High' ? '높음' : task.priority === 'Medium' ? '보통' : '낮음' }}
                  </span>
                </div>
              </div>
              
              <!-- 담당자들 -->
              <div class="flex -space-x-2">
                <div
                  v-for="(assignee, index) in task.assignees.slice(0, 3)"
                  :key="index"
                  class="size-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden"
                  :title="assignee"
                >
                  <img
                    v-if="registeredUsers.find(u => u.name === assignee)?.avatar"
                    :src="registeredUsers.find(u => u.name === assignee)?.avatar"
                    :alt="assignee"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-xs font-medium text-gray-600">
                    {{ assignee.charAt(0) }}
                  </span>
                </div>
                <div
                  v-if="task.assignees.length > 3"
                  class="size-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"
                >
                  <span class="text-xs font-medium text-gray-600">
                    +{{ task.assignees.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 즐겨찾기 뷰 -->
      <div v-if="viewType === 'favorites'">
        <h2 class="font-semibold text-gray-900 mb-4">
          즐겨찾기 업무 <span class="text-gray-500">({{ filteredFavoriteTasks.length }}개)</span>
        </h2>
        
        <div v-if="filteredFavoriteTasks.length === 0" class="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div class="inline-flex items-center justify-center size-16 bg-gray-100 rounded-full mb-4">
            <Star class="size-8 text-gray-400" />
          </div>
          <h3 class="font-medium text-gray-900 mb-2">즐겨찾기가 없습니다</h3>
          <p class="text-gray-600">
            즐겨찾기로 설정된 업무가 없습니다
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="task in filteredFavoriteTasks"
            :key="task.id"
            @click="emit('taskClick', task)"
            class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <Star class="size-4 text-yellow-500 fill-yellow-500" />
                  <h3 class="font-medium text-gray-900">{{ task.title }}</h3>
                </div>
                
                <p v-if="task.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
                  {{ task.description }}
                </p>
                
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- 보드 이름 -->
                  <span
                    v-if="boards.find(b => b.id === task.boardId)"
                    class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {{ boards.find(b => b.id === task.boardId)?.title }}
                  </span>
                  
                  <!-- 상태 -->
                  <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                    {{ getColumnLabel(task.column) }}
                  </span>
                  
                  <!-- 우선순위 -->
                  <span :class="`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`">
                    {{ task.priority === 'High' ? '높음' : task.priority === 'Medium' ? '보통' : '낮음' }}
                  </span>
                </div>
              </div>
              
              <!-- 담당자들 -->
              <div class="flex -space-x-2">
                <div
                  v-for="(assignee, index) in task.assignees.slice(0, 3)"
                  :key="index"
                  class="size-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center overflow-hidden"
                  :title="assignee"
                >
                  <img
                    v-if="registeredUsers.find(u => u.name === assignee)?.avatar"
                    :src="registeredUsers.find(u => u.name === assignee)?.avatar"
                    :alt="assignee"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-xs font-medium text-gray-600">
                    {{ assignee.charAt(0) }}
                  </span>
                </div>
                <div
                  v-if="task.assignees.length > 3"
                  class="size-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center"
                >
                  <span class="text-xs font-medium text-gray-600">
                    +{{ task.assignees.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
