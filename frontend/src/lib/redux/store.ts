import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";
import { api } from "../api/base";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(api.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
