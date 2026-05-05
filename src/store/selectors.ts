import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';
import { Course } from './slices/courseSlice';
import { UserProgress } from './slices/progressSlice';

// Basic state selectors
export const selectCourses = (state: RootState) => state.courses.courses;
export const selectUser = (state: RootState) => state.auth.user;
export const selectProgress = (state: RootState) => state.progress.progress;
export const selectTrainingPlans = (state: RootState) => state.trainingPlans.trainingPlans;

// Helper to calculate progress for a single course
export const calculateCourseProgress = (course: Course, userProgress?: UserProgress): number => {
  if (!course || !course.videos || course.videos.length === 0) return 0;
  if (!userProgress) return 0;

  let totalDuration = 0;
  let totalWatched = 0;

  course.videos.forEach((video, index) => {
    const vidId = `video_${index}`;
    const duration = video.duration || 0;
    const watched = userProgress.watchedDurations?.[vidId] || 0;
    const isCompleted = userProgress.completedVideos?.includes(vidId);

    totalDuration += duration;
    totalWatched += isCompleted ? duration : Math.min(watched, duration);
  });

  if (totalDuration <= 0) return 0;
  return Math.min(100, Math.round((totalWatched / totalDuration) * 100));
};

// Selector for Enrolled Courses with their progress
export const selectEnrolledCoursesWithProgress = createSelector(
  [selectCourses, selectUser, selectProgress],
  (courses, user, progress) => {
    if (!user || !user.enrolledCourses) return [];
    
    return user.enrolledCourses
      .map(courseId => {
        const course = courses.find(c => c.id === courseId);
        if (!course) return null;
        
        const courseProgress = progress[courseId];
        const progressPercent = calculateCourseProgress(course, courseProgress);
        
        return {
          ...course,
          progressPercent,
          lastUpdated: courseProgress?.lastUpdated || course.createdAt
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }
);

// Selector for Dashboard Stats (Donut Chart)
export const selectDashboardStats = createSelector(
  [selectEnrolledCoursesWithProgress],
  (enrolledWithProgress) => {
    const total = enrolledWithProgress.length;
    const completed = enrolledWithProgress.filter(c => c.progressPercent >= 100).length;
    const inProgress = enrolledWithProgress.filter(c => c.progressPercent > 0 && c.progressPercent < 100).length;
    const notStarted = total - completed - inProgress;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      enrolled: total,
      completed,
      inProgress,
      notStarted,
      completionRate
    };
  }
);

// Selector for Weekly Activity (Bar Chart)
export const selectWeeklyActivity = createSelector(
  [selectProgress],
  (progress) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days: { label: string; date: string; value: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      last7Days.push({
        label: days[date.getDay()],
        date: dateString,
        value: 0
      });
    }

    Object.values(progress).forEach(courseProgress => {
      if (courseProgress.dailyActivity) {
        last7Days.forEach(day => {
          if (courseProgress.dailyActivity?.[day.date]) {
            day.value += courseProgress.dailyActivity[day.date].length;
          }
        });
      }
    });

    return last7Days;
  }
);

// Selector for Learning Time (Hero Banner)
export const selectLearningTime = createSelector(
  [selectProgress],
  (progress) => {
    let totalSeconds = 0;
    
    Object.values(progress).forEach(courseProgress => {
      if (courseProgress.watchedDurations) {
        Object.values(courseProgress.watchedDurations).forEach(duration => {
          totalSeconds += duration;
        });
      }
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    return {
      totalSeconds,
      formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    };
  }
);

// Selector for "Continue Learning" section
export const selectContinueLearning = createSelector(
  [selectEnrolledCoursesWithProgress],
  (enrolledWithProgress) => {
    return enrolledWithProgress
      .filter(c => c.progressPercent > 0 && c.progressPercent < 100)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 3);
  }
);

// Selector for Assigned Training Plans
export const selectAssignedPlans = createSelector(
  [selectTrainingPlans, selectUser],
  (trainingPlans, user) => {
    if (!user || !user.assignedTrainingPlans) return [];
    return trainingPlans.filter(tp => user.assignedTrainingPlans?.includes(tp.id));
  }
);

// Selector for Saved Courses
export const selectSavedCourses = createSelector(
  [selectCourses, selectUser, selectProgress],
  (courses, user, progress) => {
    if (!user || !user.savedCourses) return [];
    return user.savedCourses
      .map(courseId => {
        const course = courses.find(c => c.id === courseId);
        if (!course) return null;
        const courseProgress = progress[courseId];
        return {
          ...course,
          progressPercent: calculateCourseProgress(course, courseProgress)
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }
);
