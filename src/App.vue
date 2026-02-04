<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
import BoardModal from './components/BoardModal.vue';
import ProfileModal from './components/ProfileModal.vue';
import AlertModal from './components/AlertModal.vue';
import ConfirmModal from './components/ConfirmModal.vue';
import { useKanbanStore } from './stores/kanbanStore';

const store = useKanbanStore();
const router = useRouter();
const route = useRoute();

const {
  isLoggedIn,
  currentUser,
  registeredUsers,
} = storeToRefs(store);

const isBoardModalOpen = ref(false);
const editingBoard = ref(null);
const isNewBoard = ref(false);
const isProfileModalOpen = ref(false);
const isAlertOpen = ref(false);
const alertTitle = ref('알림');
const alertMessage = ref('');
const isConfirmOpen = ref(false);
const confirmTitle = ref('확인');
const confirmMessage = ref('');
const confirmAction = ref(null);
const confirmType = ref('primary');

// Check if current route is login page
const isLoginPage = computed(() => route.name === 'Login');

const showAlert = (message, title = '알림') => {
  alertTitle.value = title;
  alertMessage.value = message;
  isAlertOpen.value = true;
};

const showConfirm = (message, title = '확인', action, type = 'primary') => {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmAction.value = action;
  confirmType.value = type;
  isConfirmOpen.value = true;
};

const handleConfirm = () => {
  if (confirmAction.value) {
    confirmAction.value();
  }
  isConfirmOpen.value = false;
  confirmAction.value = null;
};

onMounted(async () => {
  await store.initialize();
  // Redirect handled by router guards
});

// Login/Register Handlers (emitted from LoginPage via router-view)
const handleLogin = async (email, password, callback) => {
  const success = await store.loginUser(email, password);
  if (success) {
    router.push('/');
  }
  if (callback) callback(success);
};

const handleRegister = async (name, email, password, callback) => {
  const success = await store.registerUser(name, email, password);
  if (callback) callback(success);
};

const handleLogout = () => {
  showConfirm('정말 로그아웃하시겠습니까?', '로그아웃', () => {
    store.logoutUser();
    router.push('/login');
  }, 'danger');
};

// Navigation Handlers
const handleLogoClick = () => router.push('/');

const handleViewChange = (view) => {
  if (view === 'dashboard') router.push('/');
  else if (view === 'myTasks') router.push('/my-tasks');
  else if (view === 'favorites') router.push('/favorites');
};

const handleProfileClick = () => {
  isProfileModalOpen.value = true;
};

// Board Actions (emitted from DashboardView/KanbanBoardView)
const handleCreateBoard = () => {
  editingBoard.value = null;
  isNewBoard.value = true;
  isBoardModalOpen.value = true;
};

const handleEditBoard = (board) => {
  editingBoard.value = { ...board };
  isNewBoard.value = false;
  isBoardModalOpen.value = true;
};

const getBoardTitle = (id) => {
    return store.boards.find(b => b.id === id)?.title;
}

const handleDeleteBoard = async (boardId) => {
  const boardTitle = getBoardTitle(boardId);
  showConfirm(`정말 '${boardTitle}' 보드를 삭제하시겠습니까?`, '보드 삭제', async () => {
    await store.deleteBoard(boardId);
    router.push('/');
    showAlert('보드가 삭제되었습니다.', '완료');
  }, 'danger');
};

const handleSaveBoard = async (board) => {
  const wasNew = isNewBoard.value;
  await store.saveBoard(board, isNewBoard.value);
  isBoardModalOpen.value = false;
  editingBoard.value = null;
  isNewBoard.value = false;
  showAlert(wasNew ? '보드가 생성되었습니다.' : '보드가 수정되었습니다.', '완료');
};

const handleUpdateProfile = async (user) => {
  await store.updateProfile(user);
};

// Task/Board Click Handlers (from Dashboard)
const handleBoardClick = (boardId) => {
  router.push(`/board/${boardId}`);
};

const handleTaskClick = (task) => {
  const check = store.checkBoardAccess(task.boardId);
  if (!check.allowed) {
    showAlert(check.error || '접근 권한이 없습니다.', '오류');
    return;
  }
  router.push(`/board/${task.boardId}`);
};

</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 사이드바: 로그인 상태이고 로그인 페이지가 아닐 때만 표시 -->
    <Sidebar
      v-if="isLoggedIn && !isLoginPage"
      :user="currentUser"
      :current-view="store.currentView"
      @view-change="handleViewChange"
      @logout="handleLogout"
      @profile-click="handleProfileClick"
      @logo-click="handleLogoClick"
    />

    <!-- 메인 콘텐츠 영역 -->
    <div class="flex-1 overflow-hidden relative">
      <router-view
        @login="handleLogin"
        @register="handleRegister"
        @create-board="handleCreateBoard"
        @edit-board="handleEditBoard"
        @delete-board="handleDeleteBoard"
        @board-click="handleBoardClick"
        @task-click="handleTaskClick"
        @back="() => router.push('/')"
      />
    </div>

    <!-- 모달 컴포넌트들 -->
    <BoardModal
      v-if="currentUser"
      :board="editingBoard"
      :is-open="isBoardModalOpen"
      :is-new-board="isNewBoard"
      :available-users="registeredUsers"
      :current-user-email="currentUser?.email || ''"
      @close="() => {
        isBoardModalOpen = false;
        editingBoard = null;
        isNewBoard = false;
      }"
      @save="handleSaveBoard"
    />

    <ProfileModal
      v-if="currentUser"
      :user="currentUser"
      :is-open="isProfileModalOpen"
      @close="isProfileModalOpen = false"
      @save="handleUpdateProfile"
    />

    <AlertModal
      :is-open="isAlertOpen"
      :title="alertTitle"
      :message="alertMessage"
      @close="isAlertOpen = false"
    />

    <ConfirmModal
      :is-open="isConfirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :type="confirmType"
      @close="isConfirmOpen = false"
      @confirm="handleConfirm"
    />
  </div>
</template>
