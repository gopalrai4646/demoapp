import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  enrolledCourses?: string[];
  savedCourses?: string[];
  assignedTrainingPlans?: string[];
  photoURL: string | null;
  phoneNumber: string | null;
  createdAt?: string;
}

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    fetchUsersRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess: (state, action: PayloadAction<User[]>) => {
      state.loading = false;
      state.users = action.payload;
      state.error = null;
    },
    fetchUsersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteUserRequest: (state, _action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    deleteUserSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.users = state.users.filter(u => u.id !== action.payload);
      state.error = null;
    },
    assignTrainingPlanRequest: (state, _action: PayloadAction<{ userId: string; trainingPlanIds: string[] }>) => {
      state.loading = true;
    },
    assignTrainingPlanSuccess: (state, action: PayloadAction<{ userId: string; trainingPlanIds: string[] }>) => {
      const user = state.users.find(u => u.id === action.payload.userId);
      if (user) {
        const existing = user.assignedTrainingPlans || [];
        const merged = [...new Set([...existing, ...action.payload.trainingPlanIds])];
        user.assignedTrainingPlans = merged;
      }
      state.loading = false;
    },
    unassignTrainingPlanRequest: (state, _action: PayloadAction<{ userId: string; trainingPlanId: string }>) => {
      state.loading = true;
    },
    unassignTrainingPlanSuccess: (state, action: PayloadAction<{ userId: string; trainingPlanId: string }>) => {
      const user = state.users.find(u => u.id === action.payload.userId);
      if (user) {
        user.assignedTrainingPlans = (user.assignedTrainingPlans || []).filter(
          id => id !== action.payload.trainingPlanId
        );
      }
      state.loading = false;
    },
    clearUsers: (state) => {
      state.users = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  fetchUsersRequest,
  fetchUsersSuccess,
  fetchUsersFailure,
  deleteUserRequest,
  deleteUserSuccess,
  assignTrainingPlanRequest,
  assignTrainingPlanSuccess,
  unassignTrainingPlanRequest,
  unassignTrainingPlanSuccess,
  clearUsers,
} = userSlice.actions;

export default userSlice.reducer;
