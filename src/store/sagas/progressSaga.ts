import { call, put, takeLatest, takeEvery } from 'redux-saga/effects';
import firestore from '@react-native-firebase/firestore';
import {
  fetchProgressRequest,
  fetchProgressSuccess,
  fetchProgressFailure,
  updateProgressRequest,
  updateRatingRequest,
  updateLocalRating,
  updateLocalProgress,
  UserProgress
} from '../slices/progressSlice';

function* handleUpdateRating(action: ReturnType<typeof updateRatingRequest>): any {
  try {
    const { userId, courseId, rating } = action.payload;
    
    yield put(updateLocalRating({ courseId, rating }));

    const progressRef = firestore().collection('userProgress').doc(`${userId}_${courseId}`);
    
    yield call([progressRef, progressRef.set], { courseId }, { merge: true });

    const updates = {
      rating,
      isRated: true,
      lastUpdated: new Date().toISOString(),
    };

    yield call([progressRef, progressRef.update], updates);
  } catch (error: any) {
    console.error('Saga: Error updating rating:', error);
  }
}

function* handleFetchProgress(action: ReturnType<typeof fetchProgressRequest>): any {
  try {
    const { userId, courseId } = action.payload;
    const progressRef = firestore().collection('userProgress').doc(`${userId}_${courseId}`);
    const progressSnap = yield call([progressRef, progressRef.get]);

    if (progressSnap.exists) {
      yield put(fetchProgressSuccess(progressSnap.data() as UserProgress));
    } else {
      const initialProgress: UserProgress = {
        courseId,
        watchedDurations: {},
        completedVideos: [],
        lastUpdated: new Date().toISOString(),
      };
      yield put(fetchProgressSuccess(initialProgress));
    }
  } catch (error: any) {
    yield put(fetchProgressFailure(error.message));
  }
}

function* handleUpdateProgress(action: ReturnType<typeof updateProgressRequest>): any {
  try {
    const { userId, courseId, videoId, watchedDuration, isCompleted } = action.payload;
    
    yield put(updateLocalProgress({ courseId, videoId, watchedDuration, isCompleted }));

    const progressRef = firestore().collection('userProgress').doc(`${userId}_${courseId}`);
    
    yield call([progressRef, progressRef.set], { courseId }, { merge: true });

    const today = new Date().toISOString().split('T')[0];
    const updates: any = {
      [`watchedDurations.${videoId}`]: watchedDuration,
      [`dailyActivity.${today}`]: firestore.FieldValue.arrayUnion(videoId),
      lastUpdated: new Date().toISOString(),
    };

    if (isCompleted) {
      updates.completedVideos = firestore.FieldValue.arrayUnion(videoId);
    }

    yield call([progressRef, progressRef.update], updates);
  } catch (error: any) {
    console.error('Saga: Error updating progress:', error);
  }
}

export default function* progressSaga() {
  yield takeLatest(fetchProgressRequest.type, handleFetchProgress);
  yield takeLatest(updateRatingRequest.type, handleUpdateRating);
  yield takeEvery(updateProgressRequest.type, handleUpdateProgress);
}
