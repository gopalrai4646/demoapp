import { call, put, takeLatest, take, fork, cancel, all } from 'redux-saga/effects';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { eventChannel } from 'redux-saga';
import { ENV } from '../../config/env';
import { 
  fetchUsersRequest, 
  fetchUsersSuccess, 
  fetchUsersFailure,
  deleteUserRequest,
  deleteUserSuccess,
  approveTeacherRequest,
  approveTeacherSuccess,
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
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const token = yield call([currentUser, currentUser.getIdToken]);

    const response = yield call(fetch, `${ENV.API_URL}/api/admin/users/delete`, {
      method: 'POST',
      body: JSON.stringify({ uid: userId }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = yield call([response, response.json]);
      throw new Error(errorData.error || 'Failed to delete user');
    }

    yield put(deleteUserSuccess(userId));
  } catch (error: any) {
    console.error('Saga: Error deleting user', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleApproveTeacher(action: ReturnType<typeof approveTeacherRequest>): any {
  try {
    const userId = action.payload;
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const token = yield call([currentUser, currentUser.getIdToken]);

    const response = yield call(fetch, `${ENV.API_URL}/api/admin/users/approve-teacher`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = yield call([response, response.json]);
      throw new Error(errorData.error || 'Failed to approve teacher');
    }

    yield put(approveTeacherSuccess(userId));
  } catch (error: any) {
    console.error('Saga: Error approving teacher', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleAssignTrainingPlan(action: ReturnType<typeof assignTrainingPlanRequest>): any {
  try {
    const { userId, trainingPlanIds } = action.payload;
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const token = yield call([currentUser, currentUser.getIdToken]);

    console.log(`Saga: Assigning plan to user ${userId} at ${ENV.API_URL}/api/admin/users/assign-plan`);
    const response = yield call(fetch, `${ENV.API_URL}/api/admin/users/assign-plan`, {
      method: 'POST',
      body: JSON.stringify({ userId, trainingPlanIds, action: 'assign' }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    console.log(`Saga: API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorData = yield call([response, response.json]);
      console.error('Saga: Assign API Error details:', errorData);
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    yield put(assignTrainingPlanSuccess({ userId, trainingPlanIds }));
  } catch (error: any) {
    console.error('Saga: Detailed error assigning training plan:', error);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleUnassignTrainingPlan(action: ReturnType<typeof unassignTrainingPlanRequest>): any {
  try {
    const { userId, trainingPlanId } = action.payload;
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error('Not authenticated');

    const token = yield call([currentUser, currentUser.getIdToken]);

    console.log(`Saga: Unassigning plan ${trainingPlanId} from user ${userId} at ${ENV.API_URL}/api/admin/users/assign-plan`);
    const response = yield call(fetch, `${ENV.API_URL}/api/admin/users/assign-plan`, {
      method: 'POST',
      body: JSON.stringify({ userId, trainingPlanIds: [trainingPlanId], action: 'unassign' }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    console.log(`Saga: API Response Status (Unassign): ${response.status}`);

    if (!response.ok) {
      const errorData = yield call([response, response.json]);
      console.error('Saga: Unassign API Error details:', errorData);
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    yield put(unassignTrainingPlanSuccess({ userId, trainingPlanId }));
  } catch (error: any) {
    console.error('Saga: Detailed error unassigning training plan:', error);
    yield put(fetchUsersFailure(error.message));
  }
}

export function* userSaga() {
  yield all([
    fork(watchFetchUsers),
    takeLatest(logoutSuccess.type, handleLogout),
    takeLatest(deleteUserRequest.type, handleDeleteUser),
    takeLatest(approveTeacherRequest.type, handleApproveTeacher),
    takeLatest(assignTrainingPlanRequest.type, handleAssignTrainingPlan),
    takeLatest(unassignTrainingPlanRequest.type, handleUnassignTrainingPlan),
  ]);
}
