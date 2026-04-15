import { createSlice, PayloadAction } from '@reduxjs/toolkit';



interface SettingsState {
  isMobileMenuOpen: boolean;
  isSidebarCollapsed: boolean;
}

const initialState: SettingsState = {
  isMobileMenuOpen: false,
  isSidebarCollapsed: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
  },
});

export const { 
  toggleMobileMenu, 
  setMobileMenuOpen, 
  toggleSidebar, 
  setSidebarCollapsed 
} = settingsSlice.actions;
export default settingsSlice.reducer;
