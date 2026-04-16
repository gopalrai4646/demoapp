import { call, put, takeLatest, all, take } from 'redux-saga/effects';
import firestore from '@react-native-firebase/firestore';
import { eventChannel } from 'redux-saga';
import { ENV } from '../../config/env';
import {
  fetchUsersRequest,
  fetchUsersSuccess,
  fetchUsersFailure,
  User,
  deleteUserRequest,
  deleteUserSuccess,
  assignTrainingPlanRequest,
  assignTrainingPlanSuccess,
  unassignTrainingPlanRequest,
  unassignTrainingPlanSuccess,
} from '../slices/userSlice';

function createUsersChannel() {
  return eventChannel(emit => {
    const q = firestore().collection('users');
    return q.onSnapshot((snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        users.push({ 
          id: doc.id, 
          ...data,
          name: data.displayName || data.name || '',
        } as User);
      });
      emit(users);
    }, (error) => {
      console.error("Users listener error:", error);
    });
  });
}

function* handleFetchUsers(): any {
  const channel = yield call(createUsersChannel);
  try {
    while (true) {
      const users = yield take(channel);
      yield put(fetchUsersSuccess(users));
    }
  } catch (error: any) {
    yield put(fetchUsersFailure(error.message));
  } finally {
    channel.close();
  }
}

function* handleDeleteUser(action: ReturnType<typeof deleteUserRequest>): any {
  try {
    const userId = action.payload;

    const userDocRef = firestore().collection('users').doc(userId);
    const userDoc: any = yield call([userDocRef, 'get']);
    let userEmail = '';
    if (userDoc.exists) {
      userEmail = userDoc.data().email?.toLowerCase();
    }

    const authResponse = yield call(fetch, `${ENV.API_URL}/api/admin/users/delete`, {
      method: 'POST',
      body: JSON.stringify({ uid: userId }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!authResponse.ok) {
      const errorData = yield call([authResponse, authResponse.json]);
      throw new Error(errorData.error || 'Failed to delete user from Authentication');
    }

    const userRef = firestore().collection('users').doc(userId);
    yield call([userRef, 'delete'] as any);

    yield put(deleteUserSuccess(userId));
  } catch (error: any) {
    console.error('Saga: Error deleting user', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleAssignTrainingPlan(action: ReturnType<typeof assignTrainingPlanRequest>): any {
  try {
    const { userId, trainingPlanIds } = action.payload;
    const userRef = firestore().collection('users').doc(userId);
    yield call([userRef, 'update'] as any, {
      assignedTrainingPlans: firestore.FieldValue.arrayUnion(...trainingPlanIds),
    });
    yield put(assignTrainingPlanSuccess({ userId, trainingPlanIds }));
  } catch (error: any) {
    console.error('Saga: Error assigning training plan', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleUnassignTrainingPlan(action: ReturnType<typeof unassignTrainingPlanRequest>): any {
  try {
    const { userId, trainingPlanId } = action.payload;
    const userRef = firestore().collection('users').doc(userId);
    yield call([userRef, 'update'] as any, {
      assignedTrainingPlans: firestore.FieldValue.arrayRemove(trainingPlanId),
    });
    yield put(unassignTrainingPlanSuccess({ userId, trainingPlanId }));
  } catch (error: any) {
    console.error('Saga: Error unassigning training plan', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

export function* watchUsers() {
  yield takeLatest(fetchUsersRequest.type, handleFetchUsers);
  yield takeLatest(deleteUserRequest.type, handleDeleteUser);
  yield takeLatest(assignTrainingPlanRequest.type, handleAssignTrainingPlan);
  yield takeLatest(unassignTrainingPlanRequest.type, handleUnassignTrainingPlan);
}

export function* userSaga() {
  yield all([watchUsers()]);
}
