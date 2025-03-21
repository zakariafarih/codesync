import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import counterReducer from '../counterSlice'
import explorerReducer from '../sideExplorerSlice'
import packageReducer from '../PackageState'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    sideExplorer: explorerReducer,
    packageState: packageReducer,
  },
})

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
