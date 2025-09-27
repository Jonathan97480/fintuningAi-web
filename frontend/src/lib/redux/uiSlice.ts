import { PayloadAction, createSlice } from "@reduxjs/toolkit";

type ThemeMode = "dark" | "light";

interface UiState {
  isSidebarOpen: boolean;
  theme: ThemeMode;
}

const initialState: UiState = {
  isSidebarOpen: false,
  theme: "dark",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
