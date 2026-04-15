import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProgress {
  courseId: string;
  watchedDurations: { [videoId: string]: number };
  completedVideos: string[];
  lastUpdated: string;
  rating?: number;
  isRated?: boolean;
  dailyActivity?: { [date: string]: string[] };
}

interface ProgressState {
  progress: { [courseId: string]: UserProgress };
  loading: boolean;
  error: string | null;
}

const initialState: ProgressState = {
  progress: {},
  loading: false,
  error: null,
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    fetchProgressRequest: (state, _action: PayloadAction<{ userId: string; courseId: string }>) => {
      state.loading = true;
      state.error = null;
    },
    fetchProgressSuccess: (state, action: PayloadAction<UserProgress>) => {
      const { courseId, watchedDurations, completedVideos, lastUpdated, rating, isRated, dailyActivity } = action.payload;
      state.progress[courseId] = {
        courseId,
        watchedDurations: watchedDurations || {},
        completedVideos: completedVideos || [],
        lastUpdated: lastUpdated || new Date().toISOString(),
        rating,
        isRated,
        dailyActivity: dailyActivity || {},
      };
      state.loading = false;
    },
    fetchProgressFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateProgressRequest: (state, _action: PayloadAction<{ userId: string; courseId: string; videoId: string; watchedDuration: number; isCompleted: boolean }>) => {
      // Handled by saga for Firestore sync, but we can optimistically update state if needed
    },
    updateRatingRequest: (state, _action: PayloadAction<{ userId: string; courseId: string; rating: number }>) => {
      state.loading = true;
    },
    updateLocalRating: (state, action: PayloadAction<{ courseId: string; rating: number }>) => {
      const { courseId, rating } = action.payload;
      if (state.progress[courseId]) {
        state.progress[courseId].rating = rating;
        state.progress[courseId].isRated = true;
        state.progress[courseId].lastUpdated = new Date().toISOString();
      }
      state.loading = false;
    },
    updateLocalProgress: (state, action: PayloadAction<{ courseId: string; videoId: string; watchedDuration: number; isCompleted: boolean }>) => {
      const { courseId, videoId, watchedDuration, isCompleted } = action.payload;
      if (!state.progress[courseId]) {
        state.progress[courseId] = {
          courseId,
          watchedDurations: {},
          completedVideos: [],
          lastUpdated: new Date().toISOString(),
          dailyActivity: {},
        };
      }
      
      const currentProgress = state.progress[courseId];
      
      // Defensive initialization for existing records
      if (!currentProgress.watchedDurations) currentProgress.watchedDurations = {};
      if (!currentProgress.completedVideos) currentProgress.completedVideos = [];
      if (!currentProgress.dailyActivity) currentProgress.dailyActivity = {};

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      if (!currentProgress.dailyActivity[today]) {
        currentProgress.dailyActivity[today] = [];
      }
      if (!currentProgress.dailyActivity[today].includes(videoId)) {
        currentProgress.dailyActivity[today].push(videoId);
      }

      // Only update if the new duration is greater to avoid rewinding progress
      if (!currentProgress.watchedDurations[videoId] || watchedDuration > currentProgress.watchedDurations[videoId]) {
        currentProgress.watchedDurations[videoId] = watchedDuration;
      }
      
      if (isCompleted && !currentProgress.completedVideos.includes(videoId)) {
        currentProgress.completedVideos.push(videoId);
      }
      
      currentProgress.lastUpdated = new Date().toISOString();
    },
    clearProgress: (state) => {
      state.progress = {};
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  fetchProgressRequest,
  fetchProgressSuccess,
  fetchProgressFailure,
  updateProgressRequest,
  updateRatingRequest,
  updateLocalRating,
  updateLocalProgress,
  clearProgress,
} = progressSlice.actions;

export default progressSlice.reducer;
