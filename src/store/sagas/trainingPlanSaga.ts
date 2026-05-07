import { call, put, takeLatest, take, fork, cancel, all } from 'redux-saga/effects';
import firestore from '@react-native-firebase/firestore';
import { eventChannel } from 'redux-saga';
import { 
  fetchTrainingPlansRequest, 
  fetchTrainingPlansSuccess, 
  fetchTrainingPlansFailure,
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
    }, (error) => {
      if (error.code !== 'permission-denied' && error.code !== 'firestore/permission-denied') {
        console.error("Training plans listener error:", error);
      }
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

function* handleLogout(): any {
  if (fetchPlansTask) yield cancel(fetchPlansTask);
}

export function* trainingPlanSaga() {
  yield all([
    fork(watchFetchPlans),
    takeLatest(logoutSuccess.type, handleLogout),
  ]);
}
