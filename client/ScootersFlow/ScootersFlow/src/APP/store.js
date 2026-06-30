import { configureStore } from '@reduxjs/toolkit';
// מייבאים רק את ה-baseApi המאוחד
import { baseApi } from '../API/BaseApi';

export const store = configureStore({
  reducer: {
    // במקום שלושה רדיוסרים נפרדים, אנחנו משתמשים בזה של ה-baseApi
    [baseApi.reducerPath]: baseApi.reducer,
  },
  // הוספת ה-Middleware בצורה מרוכזת
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
