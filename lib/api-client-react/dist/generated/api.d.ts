import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { CreateEntryBody, CreateHustleBody, DeleteResult, Entry, Goal, GoalResponse, HealthStatus, Hustle, ListEntriesParams, ResetBody, SetGoalBody, Stats, Summary, UpdateEntryBody, UpdateHustleBody } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List all side hustles
 */
export declare const getListHustlesUrl: () => string;
export declare const listHustles: (options?: RequestInit) => Promise<Hustle[]>;
export declare const getListHustlesQueryKey: () => readonly ["/api/hustles"];
export declare const getListHustlesQueryOptions: <TData = Awaited<ReturnType<typeof listHustles>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listHustles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listHustles>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListHustlesQueryResult = NonNullable<Awaited<ReturnType<typeof listHustles>>>;
export type ListHustlesQueryError = ErrorType<unknown>;
/**
 * @summary List all side hustles
 */
export declare function useListHustles<TData = Awaited<ReturnType<typeof listHustles>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listHustles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new side hustle
 */
export declare const getCreateHustleUrl: () => string;
export declare const createHustle: (createHustleBody: CreateHustleBody, options?: RequestInit) => Promise<Hustle>;
export declare const getCreateHustleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createHustle>>, TError, {
        data: BodyType<CreateHustleBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createHustle>>, TError, {
    data: BodyType<CreateHustleBody>;
}, TContext>;
export type CreateHustleMutationResult = NonNullable<Awaited<ReturnType<typeof createHustle>>>;
export type CreateHustleMutationBody = BodyType<CreateHustleBody>;
export type CreateHustleMutationError = ErrorType<unknown>;
/**
 * @summary Create a new side hustle
 */
export declare const useCreateHustle: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createHustle>>, TError, {
        data: BodyType<CreateHustleBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createHustle>>, TError, {
    data: BodyType<CreateHustleBody>;
}, TContext>;
/**
 * @summary Update a hustle (e.g. set recurring schedule)
 */
export declare const getUpdateHustleUrl: (id: number) => string;
export declare const updateHustle: (id: number, updateHustleBody: UpdateHustleBody, options?: RequestInit) => Promise<Hustle>;
export declare const getUpdateHustleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateHustle>>, TError, {
        id: number;
        data: BodyType<UpdateHustleBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateHustle>>, TError, {
    id: number;
    data: BodyType<UpdateHustleBody>;
}, TContext>;
export type UpdateHustleMutationResult = NonNullable<Awaited<ReturnType<typeof updateHustle>>>;
export type UpdateHustleMutationBody = BodyType<UpdateHustleBody>;
export type UpdateHustleMutationError = ErrorType<unknown>;
/**
 * @summary Update a hustle (e.g. set recurring schedule)
 */
export declare const useUpdateHustle: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateHustle>>, TError, {
        id: number;
        data: BodyType<UpdateHustleBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateHustle>>, TError, {
    id: number;
    data: BodyType<UpdateHustleBody>;
}, TContext>;
/**
 * @summary Delete a side hustle
 */
export declare const getDeleteHustleUrl: (id: number) => string;
export declare const deleteHustle: (id: number, options?: RequestInit) => Promise<DeleteResult>;
export declare const getDeleteHustleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteHustle>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteHustle>>, TError, {
    id: number;
}, TContext>;
export type DeleteHustleMutationResult = NonNullable<Awaited<ReturnType<typeof deleteHustle>>>;
export type DeleteHustleMutationError = ErrorType<unknown>;
/**
 * @summary Delete a side hustle
 */
export declare const useDeleteHustle: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteHustle>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteHustle>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List income entries
 */
export declare const getListEntriesUrl: (params?: ListEntriesParams) => string;
export declare const listEntries: (params?: ListEntriesParams, options?: RequestInit) => Promise<Entry[]>;
export declare const getListEntriesQueryKey: (params?: ListEntriesParams) => readonly ["/api/entries", ...ListEntriesParams[]];
export declare const getListEntriesQueryOptions: <TData = Awaited<ReturnType<typeof listEntries>>, TError = ErrorType<unknown>>(params?: ListEntriesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listEntries>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListEntriesQueryResult = NonNullable<Awaited<ReturnType<typeof listEntries>>>;
export type ListEntriesQueryError = ErrorType<unknown>;
/**
 * @summary List income entries
 */
export declare function useListEntries<TData = Awaited<ReturnType<typeof listEntries>>, TError = ErrorType<unknown>>(params?: ListEntriesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEntries>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Log an income entry
 */
export declare const getCreateEntryUrl: () => string;
export declare const createEntry: (createEntryBody: CreateEntryBody, options?: RequestInit) => Promise<Entry>;
export declare const getCreateEntryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEntry>>, TError, {
        data: BodyType<CreateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createEntry>>, TError, {
    data: BodyType<CreateEntryBody>;
}, TContext>;
export type CreateEntryMutationResult = NonNullable<Awaited<ReturnType<typeof createEntry>>>;
export type CreateEntryMutationBody = BodyType<CreateEntryBody>;
export type CreateEntryMutationError = ErrorType<unknown>;
/**
 * @summary Log an income entry
 */
export declare const useCreateEntry: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEntry>>, TError, {
        data: BodyType<CreateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createEntry>>, TError, {
    data: BodyType<CreateEntryBody>;
}, TContext>;
/**
 * @summary Update an income entry
 */
export declare const getUpdateEntryUrl: (id: number) => string;
export declare const updateEntry: (id: number, updateEntryBody: UpdateEntryBody, options?: RequestInit) => Promise<Entry>;
export declare const getUpdateEntryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEntry>>, TError, {
        id: number;
        data: BodyType<UpdateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateEntry>>, TError, {
    id: number;
    data: BodyType<UpdateEntryBody>;
}, TContext>;
export type UpdateEntryMutationResult = NonNullable<Awaited<ReturnType<typeof updateEntry>>>;
export type UpdateEntryMutationBody = BodyType<UpdateEntryBody>;
export type UpdateEntryMutationError = ErrorType<unknown>;
/**
 * @summary Update an income entry
 */
export declare const useUpdateEntry: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEntry>>, TError, {
        id: number;
        data: BodyType<UpdateEntryBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateEntry>>, TError, {
    id: number;
    data: BodyType<UpdateEntryBody>;
}, TContext>;
/**
 * @summary Delete an income entry
 */
export declare const getDeleteEntryUrl: (id: number) => string;
export declare const deleteEntry: (id: number, options?: RequestInit) => Promise<DeleteResult>;
export declare const getDeleteEntryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEntry>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteEntry>>, TError, {
    id: number;
}, TContext>;
export type DeleteEntryMutationResult = NonNullable<Awaited<ReturnType<typeof deleteEntry>>>;
export type DeleteEntryMutationError = ErrorType<unknown>;
/**
 * @summary Delete an income entry
 */
export declare const useDeleteEntry: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEntry>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteEntry>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Reset all entries and optionally goals
 */
export declare const getResetDataUrl: () => string;
export declare const resetData: (resetBody: ResetBody, options?: RequestInit) => Promise<DeleteResult>;
export declare const getResetDataMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetData>>, TError, {
        data: BodyType<ResetBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof resetData>>, TError, {
    data: BodyType<ResetBody>;
}, TContext>;
export type ResetDataMutationResult = NonNullable<Awaited<ReturnType<typeof resetData>>>;
export type ResetDataMutationBody = BodyType<ResetBody>;
export type ResetDataMutationError = ErrorType<unknown>;
/**
 * @summary Reset all entries and optionally goals
 */
export declare const useResetData: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof resetData>>, TError, {
        data: BodyType<ResetBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof resetData>>, TError, {
    data: BodyType<ResetBody>;
}, TContext>;
/**
 * @summary Get dashboard summary
 */
export declare const getGetSummaryUrl: () => string;
export declare const getSummary: (options?: RequestInit) => Promise<Summary>;
export declare const getGetSummaryQueryKey: () => readonly ["/api/summary"];
export declare const getGetSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getSummary>>>;
export type GetSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard summary
 */
export declare function useGetSummary<TData = Awaited<ReturnType<typeof getSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get current income goal
 */
export declare const getGetGoalUrl: () => string;
export declare const getGoal: (options?: RequestInit) => Promise<GoalResponse>;
export declare const getGetGoalQueryKey: () => readonly ["/api/goals"];
export declare const getGetGoalQueryOptions: <TData = Awaited<ReturnType<typeof getGoal>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGoal>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getGoal>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetGoalQueryResult = NonNullable<Awaited<ReturnType<typeof getGoal>>>;
export type GetGoalQueryError = ErrorType<unknown>;
/**
 * @summary Get current income goal
 */
export declare function useGetGoal<TData = Awaited<ReturnType<typeof getGoal>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGoal>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Set or update income goal
 */
export declare const getSetGoalUrl: () => string;
export declare const setGoal: (setGoalBody: SetGoalBody, options?: RequestInit) => Promise<Goal>;
export declare const getSetGoalMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof setGoal>>, TError, {
        data: BodyType<SetGoalBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof setGoal>>, TError, {
    data: BodyType<SetGoalBody>;
}, TContext>;
export type SetGoalMutationResult = NonNullable<Awaited<ReturnType<typeof setGoal>>>;
export type SetGoalMutationBody = BodyType<SetGoalBody>;
export type SetGoalMutationError = ErrorType<unknown>;
/**
 * @summary Set or update income goal
 */
export declare const useSetGoal: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof setGoal>>, TError, {
        data: BodyType<SetGoalBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof setGoal>>, TError, {
    data: BodyType<SetGoalBody>;
}, TContext>;
/**
 * @summary Get extended stats, insights, and gamification data
 */
export declare const getGetStatsUrl: () => string;
export declare const getStats: (options?: RequestInit) => Promise<Stats>;
export declare const getGetStatsQueryKey: () => readonly ["/api/stats"];
export declare const getGetStatsQueryOptions: <TData = Awaited<ReturnType<typeof getStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getStats>>>;
export type GetStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get extended stats, insights, and gamification data
 */
export declare function useGetStats<TData = Awaited<ReturnType<typeof getStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map