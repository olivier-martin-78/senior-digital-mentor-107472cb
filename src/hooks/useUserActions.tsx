import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserActionsService, UserAction, ActionType, ContentType } from '@/services/UserActionsService';

interface UseUserActionsFilters {
  userId?: string;
  startDate?: string;
  endDate?: string;
  contentType?: ContentType;
  actionType?: ActionType;
  page?: number;
  pageSize?: number;
}

export const useUserActions = (filters: UseUserActionsFilters = {}) => {
  const [page, setPage] = useState(filters.page || 1);
  const pageSize = filters.pageSize || 20;

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
  return useQuery({
    queryKey: ['usageStats', filters],
    queryFn: () => UserActionsService.getUsageStats(filters),
    enabled: true,
    refetchOnWindowFocus: false,
  });
};