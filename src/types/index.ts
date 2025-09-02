export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Board {
  _id: string;
  title: string;
  description?: string;
  columns: Column[];
  members: User[];
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  _id: string;
  title: string;
  tasks: Task[];
  order: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  assignees: User[];
  columnId: string;
  boardId: string;
  order: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: Task['priority'];
  tags: string[];
  assignees: string[];
  columnId: string;
  boardId: string;
  dueDate?: Date;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  _id: string;
}

export interface CreateBoardData {
  title: string;
  description?: string;
  members: string[];
}

export interface UpdateBoardData extends Partial<CreateBoardData> {
  _id: string;
}

export interface CreateColumnData {
  title: string;
  boardId: string;
}

export interface UpdateColumnData extends Partial<CreateColumnData> {
  _id: string;
}

export interface DragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
  reason: 'DROP' | 'CANCEL';
}

export interface SocketEventData {
  boardId: string;
  userId: string;
  timestamp: number;
}

export interface TaskMovedEventData extends SocketEventData {
  taskId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  sourceIndex: number;
  destinationIndex: number;
}

export interface TaskCreatedEventData extends SocketEventData {
  task: Task;
}

export interface TaskUpdatedEventData extends SocketEventData {
  task: Task;
}

export interface TaskDeletedEventData extends SocketEventData {
  taskId: string;
  columnId: string;
}

export interface FilterOptions {
  search: string;
  assignees: string[];
  tags: string[];
  priorities: Task['priority'][];
}

export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'dueDate' | 'title';
  direction: 'asc' | 'desc';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface OptimisticAction {
  id: string;
  type: 'CREATE_TASK' | 'UPDATE_TASK' | 'DELETE_TASK' | 'MOVE_TASK';
  data: any;
  timestamp: number;
}

export interface UIState {
  isLoading: boolean;
  error: string | null;
  selectedTask: Task | null;
  isTaskModalOpen: boolean;
  isBoardModalOpen: boolean;
  isColumnModalOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  filterOptions: FilterOptions;
  sortOptions: SortOptions;
  optimisticActions: OptimisticAction[];
}
