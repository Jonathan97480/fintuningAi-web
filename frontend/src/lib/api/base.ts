import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { JobRecord, JobEvent, FineTuneJobInput } from "shared";

type DatasetSearchResult = {
  id: string;
  name: string;
  locked: boolean;
  size: number;
  description?: string;
};

type ModelRecord = {
  id: string;
  name: string;
  task: string;
  license?: string;
  quantization: string[];
};

const baseUrl = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl, credentials: "include" }),
  tagTypes: ["Health", "Models", "Datasets", "Jobs", "JobEvents"],
  endpoints: (build) => ({
    getHealth: build.query<{ status: string; timestamp: string }, void>({
      query: () => "/health",
      providesTags: ["Health"],
    }),
    listModels: build.query<{ results: ModelRecord[] }, { task?: string } | void>({
      query: (params) => ({ url: "/hf/models", params }),
      providesTags: ["Models"],
    }),
    searchDatasets: build.query<{ results: DatasetSearchResult[] }, { q?: string; task?: string; license?: string } | void>({
      query: (params) => ({ url: "/hf/datasets/search", params }),
      providesTags: ["Datasets"],
    }),
    listJobs: build.query<JobRecord[], void>({
      query: () => "/jobs",
      providesTags: ["Jobs"],
    }),
    getJob: build.query<JobRecord, string>({
      query: (jobId) => /jobs/,
      providesTags: (_result, _error, jobId) => [{ type: "Jobs", id: jobId }],
    }),
    listJobEvents: build.query<JobEvent[], string>({
      query: (jobId) => /jobs//events,
      providesTags: (_result, _error, jobId) => [{ type: "JobEvents", id: jobId }],
    }),
    createFineTuneJob: build.mutation<{ jobId: string }, FineTuneJobInput>({
      query: (body) => ({ url: "/jobs/fine-tune", method: "POST", body }),
      invalidatesTags: ["Jobs"],
    }),
  }),
});

export const {
  useGetHealthQuery,
  useListModelsQuery,
  useSearchDatasetsQuery,
  useListJobsQuery,
  useGetJobQuery,
  useListJobEventsQuery,
  useCreateFineTuneJobMutation,
} = api;
