import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VideoItem {
  title: string;
  url: string;
  order: number;
  duration?: number; // duration in seconds
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  price: number;
  thumbnail?: string;
  videoUrl?: string; // kept for backward compatibility
  videos?: VideoItem[];
  totalDuration?: number; // sum of video durations
  enrolledUsers?: string[];
  visibility?: 'public' | 'private'; // default: 'public'
  createdAt: string;
}

interface CourseState {
  courses: Course[];
  loading: boolean;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [],
  loading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  error: null,
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    fetchCoursesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchCoursesSuccess: (state, action: PayloadAction<Course[]>) => {
      // Filter out any duplicates by ID just in case
      const uniqueCourses = action.payload.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      state.courses = uniqueCourses;
      state.loading = false;
    },
    fetchCoursesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.createLoading = false;
      state.updateLoading = false;
      state.deleteLoading = false;
      state.error = action.payload;
    },
    createCourseRequest: (state, _action: PayloadAction<Omit<Course, 'id' | 'createdAt'>>) => {
      state.createLoading = true;
      state.error = null;
    },
    createCourseSuccess: (state, action: PayloadAction<Course>) => {
      const exists = state.courses.some(c => c.id === action.payload.id);
      if (!exists) {
        state.courses.unshift(action.payload);
      }
      state.createLoading = false;
    },
    updateCourseRequest: (state, _action: PayloadAction<Partial<Course> & { id: string }>) => {
      state.updateLoading = true;
      state.error = null;
    },
    updateCourseSuccess: (state, action: PayloadAction<Course>) => {
      const index = state.courses.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.courses[index] = action.payload;
      }
      state.updateLoading = false;
    },
    deleteCourseRequest: (state, _action: PayloadAction<string>) => {
      state.deleteLoading = true;
      state.error = null;
    },
    deleteCourseSuccess: (state, action: PayloadAction<string>) => {
      state.courses = state.courses.filter(c => c.id !== action.payload);
      state.deleteLoading = false;
    },
    clearCourseError: (state) => {
      state.error = null;
    },
    enrollUserInCourseSuccess: (state, action: PayloadAction<{ courseId: string; userId: string }>) => {
      const course = state.courses.find(c => c.id === action.payload.courseId);
      if (course) {
        if (!course.enrolledUsers) {
          course.enrolledUsers = [];
        }
        if (!course.enrolledUsers.includes(action.payload.userId)) {
          course.enrolledUsers.push(action.payload.userId);
        }
      }
    }
  },
});

export const {
  fetchCoursesRequest,
  fetchCoursesSuccess,
  fetchCoursesFailure,
  createCourseRequest,
  createCourseSuccess,
  updateCourseRequest,
  updateCourseSuccess,
  deleteCourseRequest,
  deleteCourseSuccess,
  clearCourseError,
  enrollUserInCourseSuccess
} = courseSlice.actions;

export default courseSlice.reducer;
