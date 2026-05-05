import { call, put, takeLatest, all, take } from 'redux-saga/effects';
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
  TrainingPlan,
} from '../slices/trainingPlanSlice';

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
      console.error("Training plans listener error:", error);
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
    yield put(fetchTrainingPlansFailure(error.message));
  } finally {
    channel.close();
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
      createdAt: new Date().toISOString(),
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

    const usersRef = firestore().collection('users');
    const q = usersRef.where('assignedTrainingPlans', 'array-contains', id);
    const querySnapshot = yield call([q, q.get]);
    
    if (!querySnapshot.empty) {
      const batch = firestore().batch();
      querySnapshot.forEach((userDoc: any) => {
        batch.update(userDoc.ref, {
          assignedTrainingPlans: firestore.FieldValue.arrayRemove(id)
        });
      });
      yield call([batch, batch.commit]);
      console.log(`Cleaned up deleted training plan ${id} from ${querySnapshot.size} users.`);
    }

    yield put(deleteTrainingPlanSuccess(id));
  } catch (error: any) {
    yield put(fetchTrainingPlansFailure(error.message));
  }
}

export function* watchTrainingPlans() {
  yield takeLatest(fetchTrainingPlansRequest.type, handleFetchTrainingPlans);
  yield takeLatest(createTrainingPlanRequest.type, handleCreateTrainingPlan);
  yield takeLatest(updateTrainingPlanRequest.type, handleUpdateTrainingPlan);
  yield takeLatest(deleteTrainingPlanRequest.type, handleDeleteTrainingPlan);
}

export function* trainingPlanSaga() {
  yield all([watchTrainingPlans()]);
}
