import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import courseReducer from './slices/courseSlice';
import userReducer from './slices/userSlice';
import progressReducer from './slices/progressSlice';
import trainingPlanReducer from './slices/trainingPlanSlice';
import { authSaga } from './sagas/authSaga';
import { courseSaga } from './sagas/courseSaga';
import { userSaga } from './sagas/userSaga';
import progressSaga from './sagas/progressSaga';
import { trainingPlanSaga } from './sagas/trainingPlanSaga';

function* rootSaga() {
  yield all([
    authSaga(),
    courseSaga(),
    userSaga(),
    progressSaga(),
    trainingPlanSaga(),
  ]);
}

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    courses: courseReducer,
    users: userReducer,
    progress: progressReducer,
    trainingPlans: trainingPlanReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false, serializableCheck: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

