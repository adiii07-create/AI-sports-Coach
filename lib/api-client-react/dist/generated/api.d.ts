import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Activity, AnalysisInput, AnalysisResult, ErrorResponse, HealthStatus, Sport } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
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
export declare const getListSportsUrl: () => string;
/**
 * @summary List supported sports
 */
export declare const listSports: (options?: Parameters<typeof customFetch>[1]) => Promise<Sport[]>;
export declare const getListSportsQueryKey: () => readonly ["/api/sports"];
export declare const getListSportsQueryOptions: <TData = Awaited<ReturnType<typeof listSports>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSports>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSportsQueryResult = NonNullable<Awaited<ReturnType<typeof listSports>>>;
export type ListSportsQueryError = ErrorType<unknown>;
/**
 * @summary List supported sports
 */
export declare function useListSports<TData = Awaited<ReturnType<typeof listSports>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListActivitiesUrl: (sportSlug: string) => string;
/**
 * @summary List training activities for a sport
 */
export declare const listActivities: (sportSlug: string, options?: Parameters<typeof customFetch>[1]) => Promise<Activity[]>;
export declare const getListActivitiesQueryKey: (sportSlug: string) => readonly [`/api/sports/${string}/activities`];
export declare const getListActivitiesQueryOptions: <TData = Awaited<ReturnType<typeof listActivities>>, TError = ErrorType<unknown>>(sportSlug: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listActivities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listActivities>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListActivitiesQueryResult = NonNullable<Awaited<ReturnType<typeof listActivities>>>;
export type ListActivitiesQueryError = ErrorType<unknown>;
/**
 * @summary List training activities for a sport
 */
export declare function useListActivities<TData = Awaited<ReturnType<typeof listActivities>>, TError = ErrorType<unknown>>(sportSlug: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listActivities>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAnalyzeVideoUrl: () => string;
/**
 * @summary Analyze a structured sports drill video
 */
export declare const analyzeVideo: (analysisInput: AnalysisInput, options?: Parameters<typeof customFetch>[1]) => Promise<AnalysisResult>;
export declare const getAnalyzeVideoMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzeVideo>>, TError, {
        data: BodyType<AnalysisInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof analyzeVideo>>, TError, {
    data: BodyType<AnalysisInput>;
}, TContext>;
export type AnalyzeVideoMutationResult = NonNullable<Awaited<ReturnType<typeof analyzeVideo>>>;
export type AnalyzeVideoMutationBody = BodyType<AnalysisInput>;
export type AnalyzeVideoMutationError = ErrorType<ErrorResponse>;
/**
* @summary Analyze a structured sports drill video
*/
export declare const useAnalyzeVideo: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof analyzeVideo>>, TError, {
        data: BodyType<AnalysisInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof analyzeVideo>>, TError, {
    data: BodyType<AnalysisInput>;
}, TContext>;
export declare const getUploadAnalysisVideoUrl: () => string;
/**
 * @summary Process an uploaded drill video
 */
export declare const uploadAnalysisVideo: (uploadAnalysisVideoBody: Blob, options?: Parameters<typeof customFetch>[1]) => Promise<AnalysisResult>;
export declare const getUploadAnalysisVideoMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadAnalysisVideo>>, TError, {
        data: BodyType<Blob>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof uploadAnalysisVideo>>, TError, {
    data: BodyType<Blob>;
}, TContext>;
export type UploadAnalysisVideoMutationResult = NonNullable<Awaited<ReturnType<typeof uploadAnalysisVideo>>>;
export type UploadAnalysisVideoMutationBody = BodyType<Blob>;
export type UploadAnalysisVideoMutationError = ErrorType<unknown>;
/**
* @summary Process an uploaded drill video
*/
export declare const useUploadAnalysisVideo: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof uploadAnalysisVideo>>, TError, {
        data: BodyType<Blob>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof uploadAnalysisVideo>>, TError, {
    data: BodyType<Blob>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map