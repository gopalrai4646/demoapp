import { call, put, takeLatest, all, take, fork, cancel, select } from 'redux-saga/effects';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { eventChannel } from 'redux-saga';
import { 
  loginRequest, 
  signupRequest,
  googleLoginRequest,
  updateProfileRequest,
  updateProfileSuccess,
  updatePasswordRequest,
  updatePasswordSuccess,
  forgotPasswordRequest, 
  authSuccess, 
  authFailure, 
  logoutRequest, 
  logoutSuccess,
  enrollCourseRequest,
  enrollCourseSuccess,
  saveCourseRequest,
  saveCourseSuccess,
  updateUserData,
  impersonateUserRequest,
  impersonateUserSuccess,
  stopImpersonationRequest,
  stopImpersonationSuccess,
} from '../slices/authSlice';
import { enrollUserInCourseSuccess } from '../slices/courseSlice';
import { clearProgress } from '../slices/progressSlice';
import { clearUsers } from '../slices/userSlice';

function createUserChannel(uid: string) {
  return eventChannel(emit => {
    const userRef = firestore().collection('users').doc(uid);
    return userRef.onSnapshot((snapshot) => {
      const exists = typeof snapshot.exists === 'function' ? snapshot.exists() : snapshot.exists;
      if (exists) {
        const data = snapshot.data();
        if (data) {
          emit({
            user: {
              uid: uid,
              email: data.email || null,
              displayName: data.displayName || null,
              enrolledCourses: data.enrolledCourses || [],
              savedCourses: data.savedCourses || [],
              assignedTrainingPlans: data.assignedTrainingPlans || [],
              photoURL: data.photoURL || null,
              phoneNumber: data.phoneNumber || null
            },
            role: data.role || 'student'
          });
        }
      }
    }, (error) => {
      console.error("Firestore listener error:", error);
    });
  });
}

function* syncUserSession(uid: string): any {
  const channel = yield call(createUserChannel, uid);
  try {
    while (true) {
      const data = yield take(channel);
      yield put(updateUserData(data));
    }
  } finally {
    channel.close();
  }
}

let userSyncTask: any = null;

function* handleLogin(action: ReturnType<typeof loginRequest>): any {
  try {
    const { email, pass } = action.payload;
    const normalizedEmail = email.toLowerCase();

    const userCredential = yield call([auth(), auth().signInWithEmailAndPassword], normalizedEmail, pass);
    const user = userCredential.user;
    
    const userRef = firestore().collection('users').doc(user.uid);
    const userDoc: any = yield call([userRef, 'get'] as any);
    const userExists = typeof userDoc.exists === 'function' ? userDoc.exists() : userDoc.exists;
    
    if (!userExists) {
      yield call([auth(), auth().signOut]);
      throw new Error('Your account has been deleted by an administrator.');
    }

    const userData = userDoc.data();
    yield put(authSuccess({ 
      user: { 
        uid: user.uid, 
        email: user.email, 
        displayName: user.displayName, 
        enrolledCourses: userData.enrolledCourses || [], 
        savedCourses: userData.savedCourses || [], 
        assignedTrainingPlans: userData.assignedTrainingPlans || [],
        photoURL: userData.photoURL || null,
        phoneNumber: userData.phoneNumber || null
      }, 
      role: userData.role || 'student', 
      isNewUser: false 
    }));

    if (userSyncTask) yield cancel(userSyncTask);
    userSyncTask = yield fork(syncUserSession, user.uid);

  } catch (error: any) {
    let message = 'An unexpected error occurred. Please try again.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = 'Invalid email or password.';
    } else if (error.code === 'auth/network-request-failed' || error.message.includes('offline')) {
      message = 'Please check your internet connection.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many failed attempts. Please try again later.';
    }
    yield put(authFailure(message));
  }
}

function* handleSignup(action: ReturnType<typeof signupRequest>): any {
  try {
    const { email, pass, name, role, photoURL, phoneNumber } = action.payload;
    const normalizedEmail = email.toLowerCase();

    const userCredential = yield call([auth(), auth().createUserWithEmailAndPassword], normalizedEmail, pass);
    yield call([userCredential.user, userCredential.user.updateProfile], { displayName: name, photoURL });
    const user = userCredential.user;
    
    const userRef = firestore().collection('users').doc(user.uid);
    yield call([userRef, 'set'] as any, {
      uid: user.uid,
      email: user.email,
      displayName: name,
      role,
      photoURL: photoURL || null,
      phoneNumber: phoneNumber || null,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    yield put(authSuccess({ 
      user: { 
        uid: user.uid, 
        email: user.email, 
        displayName: name, 
        enrolledCourses: [], 
        savedCourses: [], 
        assignedTrainingPlans: [],
        photoURL: photoURL || null,
        phoneNumber: phoneNumber || null
      }, 
      role, 
      isNewUser: true 
    }));

    if (userSyncTask) yield cancel(userSyncTask);
    userSyncTask = yield fork(syncUserSession, user.uid);

  } catch (error: any) {
    let message = 'Failed to create account. Please try again.';
    console.error('Signup Error:', error);
    if (error.code === 'auth/email-already-in-use') {
      message = 'This email is already registered.';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Please enter a valid email address.';
    } else if (error.code === 'auth/network-request-failed' || error.message.includes('offline')) {
      message = 'Please check your internet connection.';
    } else if (error.message) {
      message = error.message;
    }
    yield put(authFailure(message));
  }
}

function* handleLogout(): any {
  try {
    yield call([auth(), auth().signOut]);
    if (userSyncTask) yield cancel(userSyncTask);
    yield put(clearProgress());
    yield put(clearUsers());
    yield put(logoutSuccess());
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

function* handleGoogleLogin(): any {
  try {
    // Basic Google Sign-In configuration
    GoogleSignin.configure({
      webClientId: '146404897369-4h5do7cgdo0hi4csl5t48nr9u3tqfkan.apps.googleusercontent.com',
      offlineAccess: true,
    });

    // Check if device has Play Services
    yield call([GoogleSignin, 'hasPlayServices']);
    
    // Sign out from any previous Google session to force account picker
    try {
      yield call([GoogleSignin, 'signOut']);
    } catch (e) {
      // Ignore sign out errors
    }

    // Trigger identity flow
    const signInResult = yield call([GoogleSignin, 'signIn']);
    
    // In newer versions, idToken might be inside data
    const idToken = signInResult.data?.idToken || signInResult.idToken;
    
    if (!idToken) {
      throw new Error('Google Sign-In failed: No ID Token received.');
    }

    // Create Firebase credential
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
    // Sign in to Firebase
    const userCredential = yield call([auth(), auth().signInWithCredential], googleCredential);
    const user = userCredential.user;

    // Sync with Firestore
    const userRef = firestore().collection('users').doc(user.uid);
    const userDoc: any = yield call([userRef, 'get'] as any);
    const userExists = typeof userDoc.exists === 'function' ? userDoc.exists() : userDoc.exists;
    
    let role: 'student' | 'admin' = 'student';
    let userData: any = {};

    if (!userExists) {
      // Register new user
      userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'student',
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber || null,
        enrolledCourses: [],
        savedCourses: [],
        assignedTrainingPlans: [],
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      yield call([userRef, 'set'] as any, userData);
    } else {
      userData = userDoc.data();
      role = userData.role || 'student';
    }

    yield put(authSuccess({ 
      user: { 
        uid: user.uid, 
        email: user.email, 
        displayName: user.displayName || userData.displayName,
        enrolledCourses: userData.enrolledCourses || [], 
        savedCourses: userData.savedCourses || [], 
        assignedTrainingPlans: userData.assignedTrainingPlans || [],
        photoURL: userData.photoURL || user.photoURL,
        phoneNumber: userData.phoneNumber || user.phoneNumber || null
      }, 
      role, 
      isNewUser: !userDoc.exists 
    }));

    // Start background sync task
    if (userSyncTask) yield cancel(userSyncTask);
    userSyncTask = yield fork(syncUserSession, user.uid);

  } catch (error: any) {
    if (error.code === 'SIGN_IN_CANCELLED') {
      // User cancelled, just stop loading
      yield put(authFailure('Sign-in cancelled.'));
      return;
    }
    console.error('Google Sign-In Error:', error);
    yield put(authFailure(error.message || 'Google authentication failed.'));
  }
}

function* handleUpdatePassword(action: ReturnType<typeof updatePasswordRequest>): any {
  try {
    const { password } = action.payload;
    const state: any = yield select();
    if (state.auth.isImpersonating) {
      throw new Error('Password updates are disabled while impersonating for security reasons.');
    }
    
    const currentUser = auth().currentUser;
    if (currentUser) {
      yield call([currentUser, currentUser.updatePassword], password);
      yield put(updatePasswordSuccess());
    }
  } catch (error: any) {
    let message = error.message;
    if (error.code === 'auth/requires-recent-login') {
      message = 'For security reasons, please log out and log back in before changing your password.';
    }
    yield put(authFailure(message));
  }
}

function* handleUpdateProfile(action: ReturnType<typeof updateProfileRequest>): any {
  try {
    const { displayName, photoURL, phoneNumber } = action.payload;
    const state: any = yield select();
    const targetUid = state.auth.user?.uid;
    const isImpersonating = state.auth.isImpersonating;
    
    if (!targetUid) throw new Error('User context not found.');

    const currentUser = auth().currentUser;
    
    if (!isImpersonating && currentUser) {
      const authUpdates: any = { displayName };
      if (photoURL !== undefined) authUpdates.photoURL = photoURL;
      yield call([currentUser, currentUser.updateProfile], authUpdates);
    }
    
    const firestoreUpdates: any = { displayName };
    if (photoURL !== undefined) firestoreUpdates.photoURL = photoURL;
    if (phoneNumber !== undefined) firestoreUpdates.phoneNumber = phoneNumber;
    
    const userRef = firestore().collection('users').doc(targetUid);
    yield call([userRef, userRef.set], firestoreUpdates, { merge: true });
    
    yield put(updateProfileSuccess({ 
      displayName, 
      photoURL: photoURL !== undefined ? photoURL : state.auth.user?.photoURL, 
      phoneNumber: phoneNumber !== undefined ? phoneNumber : state.auth.user?.phoneNumber 
    }));
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

function* handleEnrollCourse(action: ReturnType<typeof enrollCourseRequest>): any {
  try {
    const courseId = action.payload;
    const state: any = yield select();
    const targetUid = state.auth.user?.uid;
    if (!targetUid) {
      yield put(authFailure('User context not found.'));
      return;
    }

    const userRef = firestore().collection('users').doc(targetUid);
    yield call([userRef, userRef.set], {
      enrolledCourses: firestore.FieldValue.arrayUnion(courseId)
    }, { merge: true });
    
    const courseRef = firestore().collection('courses').doc(courseId);
    yield call([courseRef, courseRef.set], {
      enrolledUsers: firestore.FieldValue.arrayUnion(targetUid)
    }, { merge: true });
    
    yield put(enrollUserInCourseSuccess({ courseId, userId: targetUid }));
    yield put(enrollCourseSuccess(courseId));
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

function* handleSaveCourse(action: ReturnType<typeof saveCourseRequest>): any {
  try {
    const courseId = action.payload;
    const state: any = yield select();
    const targetUid = state.auth.user?.uid;
    
    if (!targetUid) {
      yield put(authFailure('User context not found.'));
      return;
    }

    const currentSavedCourses = state.auth.user?.savedCourses || [];
    const isSaved = currentSavedCourses.includes(courseId);
    
    const userRef = firestore().collection('users').doc(targetUid);
    
    // Atomic update: no need to 'get' first
    yield call([userRef, userRef.set], {
      savedCourses: isSaved 
        ? firestore.FieldValue.arrayRemove(courseId) 
        : firestore.FieldValue.arrayUnion(courseId)
    }, { merge: true });
    
    yield put(saveCourseSuccess(courseId));
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}
 
function* handleImpersonateUser(action: ReturnType<typeof impersonateUserRequest>): any {
  try {
    const targetUid = action.payload;
    const userDoc: any = yield call([firestore().collection('users').doc(targetUid), firestore().collection('users').doc(targetUid).get]);
    const userExists = typeof userDoc.exists === 'function' ? userDoc.exists() : userDoc.exists;
    
    if (!userExists) {
      throw new Error('User not found in Firestore.');
    }
 
    const userData = userDoc.data();
    const user = {
      uid: targetUid,
      email: userData.email || null,
      displayName: userData.displayName || null,
      enrolledCourses: userData.enrolledCourses || [],
      savedCourses: userData.savedCourses || [],
      assignedTrainingPlans: userData.assignedTrainingPlans || [],
      photoURL: userData.photoURL || null,
      phoneNumber: userData.phoneNumber || null,
    };
 
    yield put(impersonateUserSuccess({ user, role: userData.role || 'student' }));
    
    if (userSyncTask) yield cancel(userSyncTask);
    userSyncTask = yield fork(syncUserSession, targetUid);
 
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}
 
function* handleStopImpersonation(): any {
  try {
    if (userSyncTask) yield cancel(userSyncTask);

    yield put(stopImpersonationSuccess());
    
    const adminUser = auth().currentUser;
    if (adminUser) {
      userSyncTask = yield fork(syncUserSession, adminUser.uid);
    }
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}
 
function* handleForgotPassword(action: ReturnType<typeof forgotPasswordRequest>): any {
  try {
    const { email } = action.payload;
    yield call([auth(), auth().sendPasswordResetEmail], email);
    yield put(authSuccess({ user: null })); 
  } catch (error: any) {
    yield put(authFailure(error.message));
  }
}

export function* watchAuth() {
  yield takeLatest(loginRequest.type, handleLogin);
  yield takeLatest(signupRequest.type, handleSignup);
  yield takeLatest(logoutRequest.type, handleLogout);
  yield takeLatest(googleLoginRequest.type, handleGoogleLogin);
  yield takeLatest(updateProfileRequest.type, handleUpdateProfile);
  yield takeLatest(updatePasswordRequest.type, handleUpdatePassword);
  yield takeLatest(forgotPasswordRequest.type, handleForgotPassword);
  yield takeLatest(enrollCourseRequest.type, handleEnrollCourse);
  yield takeLatest(saveCourseRequest.type, handleSaveCourse);
  yield takeLatest(impersonateUserRequest.type, handleImpersonateUser);
  yield takeLatest(stopImpersonationRequest.type, handleStopImpersonation);
}

export function* authSaga() {
  yield all([watchAuth()]);
}
