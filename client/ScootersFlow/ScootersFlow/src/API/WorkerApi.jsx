import { baseApi } from './baseApi';

export const workerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkers: builder.query({
      query: () => '/workers',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Worker', id })), { type: 'Worker', id: 'LIST' }]
          : [{ type: 'Worker', id: 'LIST' }],
    }),
    login: builder.mutation({
      query: (credentials) => ({ url: '/workers/login', method: 'POST', body: credentials }),
    }),
    addWorker: builder.mutation({
      query: (newWorker) => ({ url: '/workers', method: 'POST', body: newWorker }),
      invalidatesTags: [{ type: 'Worker', id: 'LIST' }],
    }),
    updateWorker: builder.mutation({
      query: ({ id, ...updatedData }) => ({ url: `/workers/${id}`, method: 'PUT', body: updatedData }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Worker', id },
        { type: 'Worker', id: 'LIST' },
      ],
    }),
    deleteWorker: builder.mutation({
      query: (id) => ({ url: `/workers/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [
        { type: 'Worker', id },
        { type: 'Worker', id: 'LIST' },
      ],
    }),
  }),
});

export const { 
  useGetWorkersQuery, useLoginMutation, useAddWorkerMutation, 
  useUpdateWorkerMutation, useDeleteWorkerMutation 
} = workerApi;
