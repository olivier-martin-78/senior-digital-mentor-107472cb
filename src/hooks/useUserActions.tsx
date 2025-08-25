import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserActionsService, UserAction, ActionType, ContentType } from '@/services/UserActionsService';

interface UseUserActionsFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  contentType?: ContentType;
  actionType?: ActionType;
  contentTitle?: string;
  page?: number;
  pageSize?: number;
}

export const useUserActions = (filters: UseUserActionsFilters = {}) => {
  const [page, setPage] = useState(filters.page || 1);
  const pageSize = filters.pageSize || 30;

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userActions', { ...filters, page }],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;
      return await UserActionsService.getUserActions({
        ...filters,
        limit: pageSize,
        offset
      });
    },
    enabled: true,
    refetchOnWindowFocus: false,
  });

  const actions = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    actions,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
    isLoading,
    error,
    refetch,
    setPage
  };
};

export const useUsageStats = (filters: {
  startDate?: string;
  endDate?: string;
  userId?: string;
  contentType?: ContentType;
  actionType?: ActionType;
} = {}) => {
  console.log('🎯 useUsageStats hook called with filters:', {
    startDate: filters.startDate,
    endDate: filters.endDate,
    userId: filters.userId,
    contentType: filters.contentType,
    actionType: filters.actionType
  });

  return useQuery({
    queryKey: ['usageStats', filters],
    queryFn: async () => {
      console.log('🔄 useUsageStats: About to call UserActionsService.getUsageStats...');
      try {
        const result = await UserActionsService.getUsageStats(filters);
        
        console.log('✅ useUsageStats: Got result from service:', {
          resultType: typeof result,
          resultKeys: result ? Object.keys(result) : 'N/A',
          totalActions: result?.totalActions,
          uniqueUsers: result?.uniqueUsers,
          uniqueUsersFromSessions: result?.uniqueUsersFromSessions,
          topContentLength: result?.topContent?.length || 0,
          sessionsByUserLength: result?.sessionsByUser?.length || 0,
          usersFromActionsLength: result?.usersFromActions?.length || 0
        });

        // Log complet des données si elles sont vides
        if (!result || result.totalActions === 0) {
          console.warn('⚠️ useUsageStats: Empty or zero result detected:', {
            result,
            isEmpty: !result,
            isZero: result?.totalActions === 0
          });
        }

        return result;
      } catch (error) {
        console.error('❌ useUsageStats: Error in queryFn:', {
          errorType: typeof error,
          errorMessage: (error as any)?.message,
          errorCode: (error as any)?.code,
          fullError: error
        });
        throw error;
      }
    },
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache pendant 30 secondes
    refetchOnMount: true, // Refresh à chaque montage du composant
    retry: (failureCount, error) => {
      console.log('🔄 useUsageStats: Retry attempt', failureCount, 'Error:', error);
      return failureCount < 3;
    }
  });
};