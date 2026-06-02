import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PaymentState {
  isProcessing: boolean;
  error: string | null;
  lastPaymentId: string | null;
}

const initialState: PaymentState = {
  isProcessing: false,
  error: null,
  lastPaymentId: null,
};

export const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    initiatePaymentRequest: (
      state,
      action: PayloadAction<{ courseId: string; amount: number }>
    ) => {
      state.isProcessing = true;
      state.error = null;
    },
    paymentSuccess: (state, action: PayloadAction<{ paymentId: string }>) => {
      state.isProcessing = false;
      state.lastPaymentId = action.payload.paymentId;
      state.error = null;
    },
    paymentFailure: (state, action: PayloadAction<{ error: string }>) => {
      state.isProcessing = false;
      state.error = action.payload.error;
    },
    clearPaymentError: (state) => {
      state.error = null;
    },
  },
});

export const {
  initiatePaymentRequest,
  paymentSuccess,
  paymentFailure,
  clearPaymentError,
} = paymentSlice.actions;

export default paymentSlice.reducer;
