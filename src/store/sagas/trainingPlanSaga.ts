import { call, put, takeLatest, take, fork, cancel, all } from 'redux-saga/effects';
import firestore from '@react-native-firebase/firestore';
import { eventChannel } from 'redux-saga';
import { 
  fetchTrainingPlansRequest, 
  fetchTrainingPlansSuccess, 
  fetchTrainingPlansFailure,
  createTrainingPlanRequest,
  createTrainingPlanSuccess,
  updateTrainingPlanRequest,
  updateTrainingPlanSuccess,
  deleteTrainingPlanRequest,
  deleteTrainingPlanSuccess,
  TrainingPlan
} from '../slices/trainingPlanSlice';
import { logoutSuccess } from '../slices/authSlice';

function createTrainingPlansChannel() {
  return eventChannel(emit => {
    const q = firestore().collection('trainingPlans');
    return q.onSnapshot((snapshot) => {
      const plans: TrainingPlan[] = [];
      snapshot.forEach((doc: any) => {
        plans.push({ id: doc.id, ...doc.data() });
      });
      emit(plans);
    }, (error: any) => {
      console.error("Training plans listener error:", error);
      // Emit empty array on permission-denied so loading state resolves
      emit([]);
    });
  });
}

function* handleFetchTrainingPlans(): any {
  const channel = yield call(createTrainingPlansChannel);
  try {
    while (true) {
      const plans = yield take(channel);
      yield put(fetchTrainingPlansSuccess(plans));
    }
  } catch (error: any) {
    if (error.code !== 'permission-denied' && error.code !== 'firestore/permission-denied') {
      yield put(fetchTrainingPlansFailure(error.message));
    }
  } finally {
    channel.close();
  }
}

let fetchPlansTask: any = null;

function* watchFetchPlans(): any {
  while (true) {
    yield take(fetchTrainingPlansRequest.type);
    if (fetchPlansTask) yield cancel(fetchPlansTask);
    fetchPlansTask = yield fork(handleFetchTrainingPlans);
  }
}

function* handleCreateTrainingPlan(action: ReturnType<typeof createTrainingPlanRequest>): any {
  try {
    const planData = {
      ...action.payload,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };
    const collectionRef = firestore().collection('trainingPlans');
    const docRef = yield call([collectionRef, collectionRef.add], planData);
    yield put(createTrainingPlanSuccess({
      id: docRef.id,
      ...action.payload,
      createdAt: new Date().toISOString()
    }));
  } catch (error: any) {
    yield put(fetchTrainingPlansFailure(error.message));
  }
}

function* handleUpdateTrainingPlan(action: ReturnType<typeof updateTrainingPlanRequest>): any {
  try {
    const { id, ...updates } = action.payload;
    const planRef = firestore().collection('trainingPlans').doc(id);
    yield call([planRef, 'update'] as any, updates);
    yield put(updateTrainingPlanSuccess({ ...action.payload } as TrainingPlan));
  } catch (error: any) {
    yield put(fetchTrainingPlansFailure(error.message));
  }
}

function* handleDeleteTrainingPlan(action: ReturnType<typeof deleteTrainingPlanRequest>): any {
  try {
    const id = action.payload;
    const planRef = firestore().collection('trainingPlans').doc(id);
    yield call([planRef, planRef.delete]);
    yield put(deleteTrainingPlanSuccess(id));
  } catch (error: any) {
    yield put(fetchTrainingPlansFailure(error.message));
  }
}

function* handleLogout(): any {
  if (fetchPlansTask) yield cancel(fetchPlansTask);
}

export function* trainingPlanSaga() {
  yield all([
    fork(watchFetchPlans),
    takeLatest(logoutSuccess.type, handleLogout),
    takeLatest(createTrainingPlanRequest.type, handleCreateTrainingPlan),
    takeLatest(updateTrainingPlanRequest.type, handleUpdateTrainingPlan),
    takeLatest(deleteTrainingPlanRequest.type, handleDeleteTrainingPlan),
  ]);
}
