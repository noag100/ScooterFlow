import { baseApi } from './baseApi';

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTasksByWorker: builder.query({
      query: (workerId) => `/tasks/worker/${workerId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Task', id })), { type: 'Task', id: 'LIST' }]
          : [{ type: 'Task', id: 'LIST' }],
    }),
    
    // --- הוסף את ה-Endpoint הזה כאן ---
    getScootersByWorker: builder.query({
      query: (workerId) => `/scooters/worker/${workerId}`, // ודא שזה ה-URL הנכון מול ה-Backend שלך
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Scooter', id })), { type: 'Scooter', id: 'LIST' }]
          : [{ type: 'Scooter', id: 'LIST' }],
    }),
    // ----------------------------------

    completeTask: builder.mutation({
      query: (taskId) => ({ url: `/tasks/${taskId}/complete`, method: 'POST' }),
      invalidatesTags: (result, error, taskId) => [
        { type: 'Task', id: taskId },
        { type: 'Task', id: 'LIST' }
      ],
    }),
  }),
});

// ייצוא של שלושת ההוקים (כולל החדש של הקורקינטים)
export const { 
  useGetTasksByWorkerQuery, 
  useCompleteTaskMutation, 
  useGetScootersByWorkerQuery 
} = taskApi;