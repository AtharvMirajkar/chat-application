import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GuestState {
  sessionId: string | null;
  guestName: string | null;
  isGuestMode: boolean;
}

const initialState: GuestState = {
  sessionId: null,
  guestName: null,
  isGuestMode: false,
};

const guestSlice = createSlice({
  name: 'guest',
  initialState,
  reducers: {
    setGuestSession: (state, action: PayloadAction<{ sessionId: string; guestName: string }>) => {
      state.sessionId = action.payload.sessionId;
      state.guestName = action.payload.guestName;
      state.isGuestMode = true;
    },
    clearGuestSession: (state) => {
      state.sessionId = null;
      state.guestName = null;
      state.isGuestMode = false;
    },
  },
});

export const { setGuestSession, clearGuestSession } = guestSlice.actions;
export default guestSlice.reducer;