import { call, put, takeLatest, all, select } from 'redux-saga/effects';
import { ENV } from '../../config/env';
import {
  fetchStaffRolesRequest,
  fetchStaffRolesSuccess,
  fetchStaffRolesFailure,
  createStaffRoleRequest,
  createStaffRoleSuccess,
  updateStaffRoleRequest,
  updateStaffRoleSuccess,
  deleteStaffRoleRequest,
  deleteStaffRoleSuccess,
  createStaffUserRequest,
  createStaffUserSuccess,
  staffRoleFailure,
} from '../slices/staffRoleSlice';

function* handleFetchStaffRoles(): any {
  try {
    const response = yield call(fetch, `${ENV.API_URL}/api/admin/roles/list`);
    const data = yield call([response, 'json']);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch roles');
    }

    yield put(fetchStaffRolesSuccess(data.roles));
  } catch (error: any) {
    yield put(fetchStaffRolesFailure(error.message));
  }
}

function* handleCreateStaffRole(action: ReturnType<typeof createStaffRoleRequest>): any {
  try {
    const { name, description, permissions } = action.payload;
    const state: any = yield select();
    const adminUid = state.auth.user?.uid;

    const response = yield call(fetch, `${ENV.API_URL}/api/admin/roles/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        permissions,
        createdBy: adminUid || 'unknown',
      }),
    });

    const data = yield call([response, 'json']);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create role');
    }

    yield put(createStaffRoleSuccess(data.role));
  } catch (error: any) {
    yield put(staffRoleFailure(error.message));
  }
}

function* handleUpdateStaffRole(action: ReturnType<typeof updateStaffRoleRequest>): any {
  try {
    const { id, name, description, permissions } = action.payload;

    const response = yield call(fetch, `${ENV.API_URL}/api/admin/roles/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name,
        description,
        permissions,
      }),
    });

    const data = yield call([response, 'json']);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update role');
    }

    yield put(updateStaffRoleSuccess(data.role));
  } catch (error: any) {
    yield put(staffRoleFailure(error.message));
  }
}

function* handleDeleteStaffRole(action: ReturnType<typeof deleteStaffRoleRequest>): any {
  try {
    const id = action.payload;

    const response = yield call(fetch, `${ENV.API_URL}/api/admin/roles/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    const data = yield call([response, 'json']);

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete role');
    }

    yield put(deleteStaffRoleSuccess(id));
  } catch (error: any) {
    yield put(staffRoleFailure(error.message));
  }
}

function* handleCreateStaffUser(action: ReturnType<typeof createStaffUserRequest>): any {
  try {
    const { name, email, password, staffRoleId } = action.payload;

    // Create the user via server-side API (Firebase Admin SDK)
    // This avoids logging out the current admin
    const response: Response = yield call(fetch, `${ENV.API_URL}/api/admin/users/create`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password, staffRoleId }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData: any = yield call([response, response.json]);
      throw new Error(errorData.error || 'Failed to create staff user');
    }

    yield put(createStaffUserSuccess());
  } catch (error: any) {
    yield put(staffRoleFailure(error.message));
  }
}

export function* watchStaffRoles() {
  yield takeLatest(fetchStaffRolesRequest.type, handleFetchStaffRoles);
  yield takeLatest(createStaffRoleRequest.type, handleCreateStaffRole);
  yield takeLatest(updateStaffRoleRequest.type, handleUpdateStaffRole);
  yield takeLatest(deleteStaffRoleRequest.type, handleDeleteStaffRole);
  yield takeLatest(createStaffUserRequest.type, handleCreateStaffUser);
}

export function* staffRoleSaga() {
  yield all([watchStaffRoles()]);
}
