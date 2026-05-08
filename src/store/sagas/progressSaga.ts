import { call, put, takeLatest, takeEvery, take, fork, cancel, all } from 'redux-saga/effects';
import firestore from '@react-native-firebase/firestore';
import { eventChannel } from 'redux-saga';
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
import { authSuccess, updateUserData } from '../slices/authSlice';

function createProgressChannel(userId: string) {
  return eventChannel(emit => {
    // Prefix query on document ID to get all progress for this user
    const q = firestore()
      .collection('userProgress')
      .orderBy('__name__')
      .startAt(`${userId}_`)
      .endAt(`${userId}_\uf8ff`);

    return q.onSnapshot((snapshot) => {
      const progressList: UserProgress[] = [];
      snapshot.forEach((doc: any) => {
        progressList.push({ ...doc.data() } as UserProgress);
      });
      emit(progressList);
    }, (error: any) => {
      if (error.code !== 'permission-denied' && error.code !== 'firestore/permission-denied') {
        console.error("Progress listener error:", error);
      }
    });
  });
}

function* syncProgressSession(userId: string): any {
  const channel = yield call(createProgressChannel, userId);
  try {
    while (true) {
      const progressList = yield take(channel);
      for (const progress of progressList) {
        yield put(fetchProgressSuccess(progress));
      }
    }
  } finally {
    channel.close();
  }
}

let progressSyncTask: any = null;

function* handleUpdateRating(action: ReturnType<typeof updateRatingRequest>): any {
  try {
    const { userId, courseId, rating } = action.payload;
    
    yield put(updateLocalRating({ courseId, rating }));

    const progressRef = firestore().collection('userProgress').doc(`${userId}_${courseId}`);
    
    const updates = {
      courseId,
      userId,
      rating,
      isRated: true,
      lastUpdated: new Date().toISOString(),
    };

    yield call([progressRef, progressRef.set], updates, { merge: true });
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
    
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const updates: any = {
      courseId,
      userId,
      [`watchedDurations.${videoId}`]: watchedDuration,
      [`dailyActivity.${today}`]: firestore.FieldValue.arrayUnion(videoId),
      lastUpdated: new Date().toISOString(),
    };

    if (isCompleted) {
      updates.completedVideos = firestore.FieldValue.arrayUnion(videoId);
    }

    yield call([progressRef, progressRef.set], updates, { merge: true });
  } catch (error: any) {
    console.error('Saga: Error updating progress:', error);
  }
}

function* handleAuthSuccess(action: any): any {
  const user = action.payload.user;
  if (user?.uid) {
    if (progressSyncTask) yield cancel(progressSyncTask);
    progressSyncTask = yield fork(syncProgressSession, user.uid);
  }
}

function* handleLogout(): any {
  if (progressSyncTask) yield cancel(progressSyncTask);
}

export default function* progressSaga() {
  yield takeLatest([authSuccess.type, updateUserData.type], handleAuthSuccess);
  yield takeLatest('auth/logoutSuccess', handleLogout);
  yield takeLatest(fetchProgressRequest.type, handleFetchProgress);
  yield takeLatest(updateRatingRequest.type, handleUpdateRating);
  yield takeEvery(updateProgressRequest.type, handleUpdateProgress);
}
