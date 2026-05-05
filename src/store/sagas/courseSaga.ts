import { call, put, takeLatest, all, take } from 'redux-saga/effects';
import firestore from '@react-native-firebase/firestore';
import { eventChannel } from 'redux-saga';
import { extractPublicIdFromUrl } from '../../utils/cloudinary-utils';
import { ENV } from '../../config/env';
import {
  fetchCoursesRequest,
  fetchCoursesSuccess,
  fetchCoursesFailure,
  createCourseRequest,
  createCourseSuccess,
  updateCourseRequest,
  updateCourseSuccess,
  deleteCourseRequest,
  deleteCourseSuccess,
  Course
} from '../slices/courseSlice';

function createCoursesChannel() {
  return eventChannel(emit => {
    const q = firestore().collection('courses').orderBy('createdAt', 'desc');
    return q.onSnapshot((snapshot) => {
      const courses: Course[] = [];
      snapshot.forEach((doc: any) => {
        courses.push({ id: doc.id, ...doc.data() });
      });
      emit(courses);
    }, (error) => {
      console.error("Courses listener error:", error);
    });
  });
}

function* handleFetchCourses(): any {
  const channel = yield call(createCoursesChannel);
  try {
    while (true) {
      const courses = yield take(channel);
      yield put(fetchCoursesSuccess(courses));
    }
  } catch (error: any) {
    yield put(fetchCoursesFailure(error.message));
  } finally {
    channel.close();
  }
}

function* handleCreateCourse(action: ReturnType<typeof createCourseRequest>): any {
  try {
    const courseData = {
      ...action.payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    const collectionRef = firestore().collection('courses');
    const docRef = yield call([collectionRef, collectionRef.add], courseData);
    yield put(createCourseSuccess({
      id: docRef.id,
      ...action.payload,
      createdAt: new Date().toISOString()
    }));
  } catch (error: any) {
    yield put(fetchCoursesFailure(error.message));
  }
}

function* handleUpdateCourse(action: ReturnType<typeof updateCourseRequest>): any {
  try {
    const { id, ...updates } = action.payload;
    const courseRef = firestore().collection('courses').doc(id);
    yield call([courseRef, 'update'] as any, updates);
    yield put(updateCourseSuccess({ ...action.payload } as Course));
  } catch (error: any) {
    yield put(fetchCoursesFailure(error.message));
  }
}

function* handleDeleteCourse(action: ReturnType<typeof deleteCourseRequest>): any {
  try {
    const id = action.payload;
    const courseRef = firestore().collection('courses').doc(id);
    const courseSnap: any = yield call([courseRef, courseRef.get]);

    if (courseSnap.exists) {
      const courseData = courseSnap.data();
      const assetsToDelete: { publicId: string; resourceType: string }[] = [];

      if (courseData.thumbnail) {
        const thumbPublicId = extractPublicIdFromUrl(courseData.thumbnail);
        if (thumbPublicId) {
          assetsToDelete.push({ publicId: thumbPublicId, resourceType: 'image' });
        }
      }

      if (courseData.videos && Array.isArray(courseData.videos)) {
        for (const video of courseData.videos) {
          if (video.url) {
            const videoPublicId = extractPublicIdFromUrl(video.url);
            if (videoPublicId) {
              assetsToDelete.push({ publicId: videoPublicId, resourceType: 'video' });
            }
          }
        }
      }

      if (courseData.videoUrl && (!courseData.videos || courseData.videos.length === 0)) {
        const videoPublicId = extractPublicIdFromUrl(courseData.videoUrl);
        if (videoPublicId) {
          assetsToDelete.push({ publicId: videoPublicId, resourceType: 'video' });
        }
      }

      for (const asset of assetsToDelete) {
        try {
          yield call(fetch, `${ENV.API_URL}/api/cloudinary/delete`, {
            method: 'POST',
            body: JSON.stringify(asset),
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error(`Saga: Failed to delete Cloudinary asset ${asset.publicId}:`, error);
        }
      }
    }

    yield call([courseRef, courseRef.delete]);

    const usersRef = firestore().collection('users');
    const enrolledQuery = usersRef.where('enrolledCourses', 'array-contains', id);
    const savedQuery = usersRef.where('savedCourses', 'array-contains', id);

    const [enrolledSnap, savedSnap]: [any, any] = yield all([
      call([enrolledQuery, enrolledQuery.get]),
      call([savedQuery, savedQuery.get])
    ]);

    if (!enrolledSnap.empty || !savedSnap.empty) {
      const userBatch = firestore().batch();
      enrolledSnap.forEach((userDoc: any) => {
        userBatch.update(userDoc.ref, {
          enrolledCourses: firestore.FieldValue.arrayRemove(id)
        });
      });
      savedSnap.forEach((userDoc: any) => {
        userBatch.update(userDoc.ref, {
          savedCourses: firestore.FieldValue.arrayRemove(id)
        });
      });
      yield call([userBatch, userBatch.commit]);
    }

    const progressRef = firestore().collection('userProgress');
    const progressQuery = progressRef.where('courseId', '==', id);
    const progressSnap: any = yield call([progressQuery, progressQuery.get]);
    
    if (!progressSnap.empty) {
      const progressBatch = firestore().batch();
      progressSnap.forEach((progDoc: any) => {
        progressBatch.delete(progDoc.ref);
      });
      yield call([progressBatch, progressBatch.commit]);
    }

    const plansRef = firestore().collection('trainingPlans');
    const plansQuery = plansRef.where('courseIds', 'array-contains', id);
    const plansSnap: any = yield call([plansQuery, plansQuery.get]);

    if (!plansSnap.empty) {
      const plansBatch = firestore().batch();
      plansSnap.forEach((planDoc: any) => {
        plansBatch.update(planDoc.ref, {
          courseIds: firestore.FieldValue.arrayRemove(id)
        });
      });
      yield call([plansBatch, plansBatch.commit]);
    }

    yield put(deleteCourseSuccess(id));

  } catch (error: any) {
    console.error(`Saga: Error in handleDeleteCourse:`, error.message);
    yield put(fetchCoursesFailure(error.message));
  }
}

export function* watchCourses() {
  yield takeLatest(fetchCoursesRequest.type, handleFetchCourses);
  yield takeLatest(createCourseRequest.type, handleCreateCourse);
  yield takeLatest(updateCourseRequest.type, handleUpdateCourse);
  yield takeLatest(deleteCourseRequest.type, handleDeleteCourse);
}

export function* courseSaga() {
  yield all([watchCourses()]);
}
