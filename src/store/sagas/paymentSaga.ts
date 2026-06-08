import { call, put, select, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { Image } from 'react-native';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import firestore from '@react-native-firebase/firestore';
import CryptoJS from 'crypto-js';
import base64 from 'base-64';
import {
  initiatePaymentRequest,
  paymentSuccess,
  paymentFailure,
} from '../slices/paymentSlice';
import { enrollCourseSuccess } from '../slices/authSlice';
import { RootState } from '../index';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '@env';

function* handleInitiatePayment(
  action: PayloadAction<{ courseId: string; amount: number }>
): any {
  try {
    const { courseId, amount } = action.payload;
    const authState = (yield select((state: RootState) => state.auth)) as any;
    const user = authState.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    if (amount === 0) {
      // 0. Free course bypass Razorpay completely
      const purchaseData = {
        courseId,
        purchaseDate: new Date().toISOString(),
        amountPaid: 0,
        razorpayPaymentId: 'FREE_COURSE',
        razorpayOrderId: 'FREE_COURSE',
      };

      const userRef = firestore().collection('users').doc(user.uid);
      yield call(async () => {
        await userRef.update({
          purchasedCourses: firestore.FieldValue.arrayUnion(purchaseData),
          enrolledCourses: firestore.FieldValue.arrayUnion(courseId),
        });
        
        const courseRef = firestore().collection('courses').doc(courseId);
        await courseRef.set(
          { enrolledUsers: firestore.FieldValue.arrayUnion(user.uid) },
          { merge: true }
        );
      });

      yield put(paymentSuccess({ paymentId: 'FREE_COURSE' }));
      yield put(enrollCourseSuccess(courseId));
      return;
    }

    // 1. Create Order via Razorpay REST API directly from frontend
    const orderResponse = (yield call(
      fetch,
      'https://api.razorpay.com/v1/orders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Basic ' +
            base64.encode(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
        },
        body: JSON.stringify({
          amount: amount * 100, // in paise
          currency: 'INR',
          receipt: `receipt_${courseId}_${user.uid}`.substring(0, 40),
        }),
      }
    )) as Response;

    const orderData = (yield call([orderResponse, 'json'])) as any;

    if (!orderResponse.ok) {
      throw new Error(orderData.error?.description || 'Failed to create order');
    }

    const orderId = orderData.id;

    // 2. Open Razorpay Checkout UI
    const options = {
      description: `Purchase Course ${courseId}`,
      image: Image.resolveAssetSource(require('../../assets/images/appicon.png')).uri,
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: amount * 100,
      name: 'Mentora LMS',
      order_id: orderId,
      prefill: {
        email: user.email || '',
        contact: '',
        name: user.name || '',
      },
      theme: { color: '#0F111A' },
    };

    const paymentResponse = (yield call(RazorpayCheckout.open, options)) as any;

    // 3. Verify Signature Locally
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      paymentResponse;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = CryptoJS.HmacSHA256(
      body,
      RAZORPAY_KEY_SECRET
    ).toString(CryptoJS.enc.Hex);

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Payment signature verification failed');
    }

    // 4. Update Firestore directly
    const purchaseData = {
      courseId,
      purchaseDate: new Date().toISOString(),
      amountPaid: amount,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    };

    const userRef = firestore().collection('users').doc(user.uid);
    yield call(async () => {
      await userRef.update({
        purchasedCourses: firestore.FieldValue.arrayUnion(purchaseData),
        enrolledCourses: firestore.FieldValue.arrayUnion(courseId),
      });

      // Update the course document so admin dashboard stats and revenue correctly calculate!
      const courseRef = firestore().collection('courses').doc(courseId);
      await courseRef.set(
        { enrolledUsers: firestore.FieldValue.arrayUnion(user.uid) },
        { merge: true }
      );
    });

    // 5. Dispatch success
    yield put(paymentSuccess({ paymentId: razorpay_payment_id }));
    // 6. Instantly unlock the course in the UI!
    yield put(enrollCourseSuccess(courseId));
  } catch (error: any) {
    yield put(paymentFailure({ error: error.message || 'Payment failed' }));
  }
}

export function* paymentSaga() {
  yield takeLatest(initiatePaymentRequest.type, handleInitiatePayment);
}
