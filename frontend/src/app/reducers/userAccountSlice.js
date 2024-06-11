import { createSlice } from "@reduxjs/toolkit";
import {
  getItem,
  removeItem,
  setItem,
} from "../../utils/localStorageManagement.js";

const initialState = {
  loading: false,
  message: null,
  error: null,
  isAuthenticated: false,
  userData: null,
  accessToken: getItem("accessToken") || null,
};

const userAccountSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loadUserRequest: (state) => {
      state.loading = true;
    },
    loadUserSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      // state.userData = action.payload;
      console.log(action.payload);
    },
    loadUserFail: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.error = action.payload;
      state.userData = null;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      setItem("accessToken", action.payload);
    },
    clearAccessToken: (state) => {
      state.accessToken = null;
      removeItem("accessToken");
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
});

export const {
  loadUserRequest,
  loadUserSuccess,
  loadUserFail,
  clearError,
  clearMessage,
  clearAccessToken,
  setAccessToken,
} = userAccountSlice.actions;

export const userReducer = userAccountSlice.reducer;
