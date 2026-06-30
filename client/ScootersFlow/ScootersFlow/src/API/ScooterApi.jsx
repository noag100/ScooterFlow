import { baseApi } from './baseApi';

export const scooterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getScooters: builder.query({
      query: () => 'scooters',
      providesTags: ['Scooter'],
    }),
    addScooter: builder.mutation({
      query: (newScooter) => ({ url: 'scooters', method: 'POST', body: newScooter }),
      invalidatesTags: ['Scooter'],
    }),
    updateScooter: builder.mutation({
      query: ({ id, ...updatedData }) => ({ url: `scooters/${id}`, method: 'PUT', body: updatedData }),
      invalidatesTags: ['Scooter'],
    }),
    deleteScooter: builder.mutation({
      query: (id) => ({ url: `scooters/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Scooter'],
    }),
    getTasks: builder.query({
      query: () => 'tasks',
      providesTags: ['Task'],
    }),
    completeTask: builder.mutation({
      query: (taskId) => ({ url: `tasks/${taskId}/complete`, method: 'POST' }),
      invalidatesTags: ['Task', 'Scooter'],
    }),
    reportDamage: builder.mutation({
      query: (scooterId) => ({ url: `tasks/report-damage/${scooterId}`, method: 'POST' }),
      invalidatesTags: ['Task', 'Scooter'],
    }),
  }),
});

export const { 
  useGetScootersQuery, useAddScooterMutation, useUpdateScooterMutation, 
  useDeleteScooterMutation, useGetTasksQuery, useCompleteTaskMutation, useReportDamageMutation 
} = scooterApi;
