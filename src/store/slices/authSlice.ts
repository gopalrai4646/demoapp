import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    enrolledCourses?: string[];
    savedCourses?: string[];
    assignedTrainingPlans?: string[];
    photoURL: string | null;
    phoneNumber: string | null;
  } | null;
  role: 'student' | 'admin' | null;
  loading: boolean;
  error: string | null;
  isNewUser: boolean;
  originalAdmin?: {
    user: AuthState['user'];
    role: AuthState['role'];
  } | null;
  isImpersonating?: boolean;
}

const initialState: AuthState = {
  user: null,
  role: null,
  loading: false,
  error: null,
  isNewUser: false,
  originalAdmin: null,
  isImpersonating: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginRequest: (state, _action: PayloadAction<{ email: string; pass: string }>) => {
      state.loading = true;
      state.error = null;
    },
    signupRequest: (state, _action: PayloadAction<{ email: string; pass: string; name: string; role: 'student' | 'admin'; photoURL?: string; phoneNumber?: string }>) => {
      state.loading = true;
      state.error = null;
    },
    googleLoginRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateProfileRequest: (state, _action: PayloadAction<{ displayName: string; photoURL?: string; phoneNumber?: string }>) => {
      state.loading = true;
      state.error = null;
    },
    updatePasswordRequest: (state, _action: PayloadAction<{ password: string }>) => {
      state.loading = true;
      state.error = null;
    },
    updatePasswordSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    updateProfileSuccess: (state, action: PayloadAction<{ displayName: string; photoURL?: string; phoneNumber?: string }>) => {
      if (state.user) {
        state.user.displayName = action.payload.displayName;
        if (action.payload.photoURL !== undefined) state.user.photoURL = action.payload.photoURL;
        if (action.payload.phoneNumber !== undefined) state.user.phoneNumber = action.payload.phoneNumber;
      }
      state.loading = false;
      state.error = null;
    },
    forgotPasswordRequest: (state, _action: PayloadAction<{ email: string }>) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action: PayloadAction<{ user: AuthState['user']; role?: 'student' | 'admin' | null; isNewUser?: boolean }>) => {
      state.user = action.payload.user;
      state.role = action.payload.role ?? null;
      state.isNewUser = action.payload.isNewUser ?? false;
      state.loading = false;
      state.error = null;
    },
    authFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logoutRequest: (state) => {
      state.loading = true;
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.role = null;
      state.isNewUser = false;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    enrollCourseRequest: (state, _action: PayloadAction<string>) => {
      state.loading = true;
    },
    enrollCourseSuccess: (state, action: PayloadAction<string>) => {
      if (state.user) {
        if (!state.user.enrolledCourses) state.user.enrolledCourses = [];
        if (!state.user.enrolledCourses.includes(action.payload)) {
          state.user.enrolledCourses.push(action.payload);
        }
      }
      state.loading = false;
    },
    saveCourseRequest: (state, _action: PayloadAction<string>) => {
      // Optional: use a separate loading state if needed
    },
    saveCourseSuccess: (state, action: PayloadAction<string>) => {
      if (state.user) {
        if (!state.user.savedCourses) state.user.savedCourses = [];
        const index = state.user.savedCourses.indexOf(action.payload);
        if (index === -1) {
          state.user.savedCourses.push(action.payload);
        } else {
          state.user.savedCourses.splice(index, 1); // Toggle save
        }
      }
    },
    updateUserData: (state, action: PayloadAction<{ user: AuthState['user']; role?: 'student' | 'admin' | null }>) => {
      // Merges incoming Firestore data into the existing auth state ONLY if UIDs match
      if (!state.user || state.user.uid !== action.payload.user?.uid) return;

      state.user = { ...state.user, ...action.payload.user };
      if (action.payload.role !== undefined) {
        state.role = action.payload.role;
      }
    },
    impersonateUserRequest: (state, _action: PayloadAction<string>) => {
      state.loading = true;
    },
    impersonateUserSuccess: (state, action: PayloadAction<{ user: AuthState['user']; role: AuthState['role'] }>) => {
      // 1. If not already impersonating, save the CURRENT user as the original admin
      if (!state.isImpersonating) {
        state.originalAdmin = {
          user: state.user,
          role: state.role
        };
      }
      // 2. Set the current user/role to the target user
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.isImpersonating = true;
      state.loading = false;
    },
    stopImpersonationRequest: (state) => {
      state.loading = true;
    },
    stopImpersonationSuccess: (state) => {
      if (state.originalAdmin) {
        state.user = state.originalAdmin.user;
        state.role = state.originalAdmin.role;
      }
      state.originalAdmin = null;
      state.isImpersonating = false;
      state.loading = false;
    },
  },
});

export const { 
  loginRequest, 
  signupRequest,
  googleLoginRequest,
  updateProfileRequest,
  updateProfileSuccess,
  updatePasswordRequest,
  updatePasswordSuccess,
  forgotPasswordRequest, 
  authSuccess, 
  authFailure, 
  logoutRequest, 
  logoutSuccess,
  clearError,
  enrollCourseRequest,
  enrollCourseSuccess,
  saveCourseRequest,
  saveCourseSuccess,
  updateUserData,
  impersonateUserRequest,
  impersonateUserSuccess,
  stopImpersonationRequest,
  stopImpersonationSuccess,
} = authSlice.actions;

export default authSlice.reducer;
