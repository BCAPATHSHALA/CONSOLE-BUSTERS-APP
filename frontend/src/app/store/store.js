import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "../reducers/userAccountSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

export default store;
