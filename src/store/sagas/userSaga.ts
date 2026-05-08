import { call, put, takeLatest, take, fork, cancel, all } from 'redux-saga/effects';
import firestore from '@react-native-firebase/firestore';
import { eventChannel } from 'redux-saga';
import { 
  fetchUsersRequest, 
  fetchUsersSuccess, 
  fetchUsersFailure,
  deleteUserRequest,
  deleteUserSuccess,
  assignTrainingPlanRequest,
  assignTrainingPlanSuccess,
  unassignTrainingPlanRequest,
  unassignTrainingPlanSuccess,
  User
} from '../slices/userSlice';
import { logoutSuccess } from '../slices/authSlice';

function createUsersChannel() {
  return eventChannel(emit => {
    const q = firestore().collection('users');
    return q.onSnapshot((snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        // Convert Firestore Timestamp to ISO string so Redux can serialize it
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === 'function') {
          createdAt = createdAt.toDate().toISOString();
        } else if (createdAt && createdAt.seconds) {
          createdAt = new Date(createdAt.seconds * 1000).toISOString();
        }
        users.push({ 
          id: doc.id, 
          ...data,
          name: data.displayName || data.name || '',
          createdAt,
        } as User);
      });
      emit(users);
    }, (error: any) => {
      // Gracefully handle permission errors (often occurs during logout)
      if (error.code !== 'permission-denied' && error.code !== 'firestore/permission-denied') {
        console.error("Users listener error:", error);
      }
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
    if (error.code !== 'permission-denied' && error.code !== 'firestore/permission-denied') {
      yield put(fetchUsersFailure(error.message));
    }
  } finally {
    channel.close();
  }
}

let fetchUsersTask: any = null;

function* watchFetchUsers(): any {
  while (true) {
    yield take(fetchUsersRequest.type);
    if (fetchUsersTask) yield cancel(fetchUsersTask);
    fetchUsersTask = yield fork(handleFetchUsers);
  }
}

function* handleLogout(): any {
  if (fetchUsersTask) yield cancel(fetchUsersTask);
}

function* handleDeleteUser(action: ReturnType<typeof deleteUserRequest>): any {
  try {
    const userId = action.payload;
    // Note: This only deletes from Firestore. 
    // To delete from Firebase Auth, a cloud function or admin API is needed.
    const userRef = firestore().collection('users').doc(userId);
    yield call([userRef, 'delete'] as any);
    yield put(deleteUserSuccess(userId));
  } catch (error: any) {
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

export function* userSaga() {
  yield all([
    fork(watchFetchUsers),
    takeLatest(logoutSuccess.type, handleLogout),
    takeLatest(deleteUserRequest.type, handleDeleteUser),
    takeLatest(assignTrainingPlanRequest.type, handleAssignTrainingPlan),
    takeLatest(unassignTrainingPlanRequest.type, handleUnassignTrainingPlan),
  ]);
}
