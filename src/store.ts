import { configureStore } from "@reduxjs/toolkit";  
  import networkReducer from "./reducers/NetworkSlice";
   import pendingTransactionsReducer from "./reducers/PendingTxnsSlice";

// reducers are named automatically based on the name field in the slice
// exported in slice files by default as nameOfSlice.reducer

const store = configureStore({
  reducer: { 
     network: networkReducer, 
     pendingTransactions: pendingTransactionsReducer,  
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
