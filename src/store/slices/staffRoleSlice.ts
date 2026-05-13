import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StaffRole, Permission } from '../../constants/permissions';

interface StaffRoleState {
  roles: StaffRole[];
  loading: boolean;
  error: string | null;
}

const initialState: StaffRoleState = {
  roles: [],
  loading: false,
  error: null,
};

const staffRoleSlice = createSlice({
  name: 'staffRoles',
  initialState,
  reducers: {
    // Fetch all staff roles
    fetchStaffRolesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchStaffRolesSuccess: (state, action: PayloadAction<StaffRole[]>) => {
      state.loading = false;
      state.roles = action.payload;
      state.error = null;
    },
    fetchStaffRolesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Create a new staff role
    createStaffRoleRequest: (state, _action: PayloadAction<{ name: string; description: string; permissions: Permission[] }>) => {
      state.loading = true;
      state.error = null;
    },
    createStaffRoleSuccess: (state, action: PayloadAction<StaffRole>) => {
      state.loading = false;
      state.roles.push(action.payload);
      state.error = null;
    },

    // Update an existing staff role
    updateStaffRoleRequest: (state, _action: PayloadAction<{ id: string; name: string; description: string; permissions: Permission[] }>) => {
      state.loading = true;
      state.error = null;
    },
    updateStaffRoleSuccess: (state, action: PayloadAction<StaffRole>) => {
      state.loading = false;
      const index = state.roles.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.roles[index] = action.payload;
      }
      state.error = null;
    },

    // Delete a staff role
    deleteStaffRoleRequest: (state, _action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    deleteStaffRoleSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.roles = state.roles.filter(r => r.id !== action.payload);
      state.error = null;
    },

    // Create a new staff user account
    createStaffUserRequest: (state, _action: PayloadAction<{ name: string; email: string; password: string; staffRoleId: string }>) => {
      state.loading = true;
      state.error = null;
    },
    createStaffUserSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },

    // General failure handler
    staffRoleFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    clearStaffRoleError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchStaffRolesRequest,
  fetchStaffRolesSuccess,
  fetchStaffRolesFailure,
  createStaffRoleRequest,
  createStaffRoleSuccess,
  updateStaffRoleRequest,
  updateStaffRoleSuccess,
  deleteStaffRoleRequest,
  deleteStaffRoleSuccess,
  createStaffUserRequest,
  createStaffUserSuccess,
  staffRoleFailure,
  clearStaffRoleError,
} = staffRoleSlice.actions;

export default staffRoleSlice.reducer;
