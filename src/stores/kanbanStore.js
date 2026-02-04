import { defineStore } from 'pinia';
import { seedBoards, seedTasks, seedLogs } from '../data/seed';
import {
  initializeAuth,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  getCurrentUser,
  updateProfile as authUpdateProfile,
  getAllRegisteredUsers,
} from '../utils/auth';
import {
  fetchLogs,
  createBoard,
  updateBoard as updateBoardApi,
  deleteBoard as deleteBoardApi,
  createTask,
  updateTask,
  deleteTask,
  createLog,
  deleteLog,
} from '../services/kanbanApi';

export const useKanbanStore = defineStore('kanban', {
  state: () => ({
    isLoggedIn: false,
    currentUser: null,
    currentView: 'dashboard',
    selectedBoardId: null,
    boards: [],
    tasks: [],
    logs: [],
    registeredUsers: [],
    isDataLoaded: false,
  }),
  getters: {
    selectedBoard(state) {
      return state.boards.find((b) => b.id === state.selectedBoardId) || null;
    },
    boardTasks(state) {
      if (!state.selectedBoardId) return [];
      return state.tasks.filter((t) => t.boardId === state.selectedBoardId);
    },
    boardLogs(state) {
      if (!state.selectedBoardId) return [];
      return state.logs.filter((l) => l.boardId === state.selectedBoardId);
    },
  },
  actions: {
    checkBoardAccess(boardId) {
      const board = this.boards.find((b) => b.id === boardId);
      if (!board) return { allowed: false, error: '보드를 찾을 수 없습니다.' };
      
      const isCreator = board.createdBy === this.currentUser?.email;
      const isMember = board.members?.some((member) => member.email === this.currentUser?.email);
      
      if (!isCreator && !isMember) {
        return { allowed: false, error: '이 보드에 접근할 권한이 없습니다.' };
      }
      return { allowed: true, board };
    },
    async initialize() {
      initializeAuth();
      const user = getCurrentUser();
      if (user) {
        this.currentUser = user;
        this.isLoggedIn = true;
      }
      this.registeredUsers = getAllRegisteredUsers();
      await this.loadData();
    },
    async loadData() {
      try {
        const [boards, tasks, logs] = await Promise.all([
          fetchBoards(),
          fetchTasks(),
          fetchLogs(),
        ]);
        this.boards = boards;
        this.tasks = tasks;
        this.logs = logs;
        this.isDataLoaded = true;
      } catch (error) {
        this.boards = seedBoards;
        this.tasks = seedTasks;
        this.logs = seedLogs;
        this.isDataLoaded = true;
      }
    },
    async loginUser(email, password) {
      const user = authLogin(email, password);
      if (user) {
        this.currentUser = user;
        this.isLoggedIn = true;
        return true;
      }
      return false;
    },
    async registerUser(name, email, password) {
      const success = authRegister(name, email, password);
      if (success) {
        const existingUser = this.registeredUsers.find((user) => user.email === email);
        if (!existingUser) {
          this.registeredUsers = [
            ...this.registeredUsers,
            {
              name,
              email,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            },
          ];
        }
      }
      return success;
    },
    logoutUser() {
      authLogout();
      this.currentUser = null;
      this.isLoggedIn = false;
      this.selectedBoardId = null;
      this.currentView = 'dashboard';
    },
    async updateProfile(user) {
      if (!this.currentUser) return false;
      const success = authUpdateProfile(user.name, user.avatar);
      if (success) {
        this.currentUser = user;
        this.registeredUsers = this.registeredUsers.map((u) =>
          u.email === user.email ? { ...u, name: user.name, avatar: user.avatar } : u
        );
      }
      return success;
    },
    setView(view) {
      this.currentView = view;
    },
    selectBoard(boardId) {
      this.selectedBoardId = boardId;
    },
    async saveBoard(board, isNew) {
      if (isNew) {
        const newBoard = {
          ...board,
          id: `board${Date.now()}`,
          createdAt: new Date().toISOString(),
          createdBy: this.currentUser?.email || '',
          createdByName: this.currentUser?.name || '',
          columns: [
            { id: 'todo', title: '할 일', color: 'bg-slate-50 border-slate-200' },
            { id: 'inProgress', title: '진행 중', color: 'bg-blue-50 border-blue-200' },
            { id: 'done', title: '완료', color: 'bg-green-50 border-green-200' }
          ]
        };
        this.boards = [...this.boards, newBoard];
        try {
          await createBoard(newBoard);
        } catch (error) {
          // Ignore API errors to keep UI responsive
        }
        return newBoard;
      }

      this.boards = this.boards.map((b) => (b.id === board.id ? board : b));
      try {
        await updateBoardApi(board);
      } catch (error) {
        // Ignore API errors to keep UI responsive
      }
      return board;
    },
    async updateBoard(board) {
      this.boards = this.boards.map((b) => (b.id === board.id ? board : b));
      try {
        await updateBoardApi(board);
      } catch (error) {
        // Ignore API errors to keep UI responsive
      }
    },
    async deleteBoard(boardId) {
      const relatedTasks = this.tasks.filter((task) => task.boardId === boardId);
      const relatedLogs = this.logs.filter((log) => log.boardId === boardId);

      this.boards = this.boards.filter((board) => board.id !== boardId);
      this.tasks = this.tasks.filter((task) => task.boardId !== boardId);
      this.logs = this.logs.filter((log) => log.boardId !== boardId);

      if (this.selectedBoardId === boardId) {
        this.selectedBoardId = null;
      }

      await Promise.all([
        deleteBoardApi(boardId).catch(() => {}),
        ...relatedTasks.map((task) => deleteTask(task.id).catch(() => {})),
        ...relatedLogs.map((log) => deleteLog(log.id).catch(() => {})),
      ]);
    },
    async addTask(task) {
      this.tasks.push(task);
      try {
        await createTask(task);
      } catch (error) {
        // Fallback
      }
    },
    async updateTaskItem(task) {
      const index = this.tasks.findIndex((t) => t.id === task.id);
      if (index !== -1) {
        this.tasks[index] = task;
        try {
          await updateTask(task);
        } catch (error) {
          // Fallback
        }
      }
    },
    async removeTask(taskId) {
      this.tasks = this.tasks.filter((t) => t.id !== taskId);
      try {
        await deleteTask(taskId);
      } catch (error) {
        // Fallback
      }
    },
    async addLogItem(log) {
      this.logs = [log, ...this.logs];
      try {
        await createLog(log);
      } catch (error) {
        // Fallback
      }
    },
  },
});
