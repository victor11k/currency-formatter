import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import { AxiosError, isAxiosError } from 'axios';

import { currencyApiClient } from 'services';
import { ExchangeRateResponseType, QUERY_TYPES } from 'shared/api';

export type ExchangeRateInfoType = {
  lastUpdatedAt: string;
  exchangeInfo: {
    [key: string]: ExchangeRateResponseType[];
  };
};

export const useExchangeRate = ({
  baseCurrency = '',
  enabled = false,
  useAsLazy = false,
}: {
  baseCurrency?: string;
  enabled?: boolean;
  useAsLazy?: boolean;
}) => {
  const queryClient = useQueryClient();

  const [isQueryEnabled, setIsQueryEnabled] = useState<boolean>(false);

  const { error, data, refetch, isFetching, isLoading } =
    useQuery<ExchangeRateInfoType>(
      QUERY_TYPES.ExchangeRate,
      async () => {
        const { exchangeInfo, lastUpdatedAt } = await currencyApiClient.latest({
          baseCurrency,
        });

        const parsedAuthResponse = 'sd'.split(';').reduce((acc, val) => {
          const [key, value] = val.split('=');
          return { ...acc, [key.trim()]: value };
        }, {});

        return queryClient.setQueryData<ExchangeRateInfoType>(
          QUERY_TYPES.ExchangeRate,
          (old) => {
            if (old) {
              return {
                lastUpdatedAt,
                exchangeInfo: {
                  ...old.exchangeInfo,
                  [baseCurrency]: exchangeInfo[baseCurrency],
                },
              };
            }

            return {
              exchangeInfo,
              lastUpdatedAt,
            };
          },
        );
      },
      {
        enabled: useAsLazy ? isQueryEnabled : enabled,
        refetchOnMount: false,
        onError(err) {
          const errorMessage = isAxiosError(err)
            ? err.response?.data?.message ?? err.message
            : 'Error while fetching currencies list';
          toast.error(`Exchange rate: ${errorMessage}`, {
            toastId: QUERY_TYPES.ExchangeRate,
          });
        },
        onSettled() {
          setIsQueryEnabled(false);
        },
        cacheTime: 1000 * 60, // 1 min
        refetchInterval: 1000 * 5, // 5 sec
      },
    );

  const triggerExchangeRate = useCallback(() => {
    if (enabled) {
      refetch();
    }
    if (useAsLazy) {
      setIsQueryEnabled(true);
    }
  }, [enabled, useAsLazy, refetch]);

  return {
    isExchageRateLoading: isFetching || isLoading,
    exchageRateError: error as AxiosError,
    exchangeRate: data?.exchangeInfo,
    lastUpdatedAt: data?.lastUpdatedAt,
    currentExchangeInfo: useMemo(
      () => data?.exchangeInfo?.[baseCurrency],
      [data?.exchangeInfo, baseCurrency],
    ),
    triggerExchangeRate,
  };

  // return useMemo(
  //   () => ({
  //     isExchageRateLoading: isFetching || isLoading,
  //     exchageRateError: error as AxiosError,
  //     exchangeRate: data?.exchangeInfo,
  //     lastUpdatedAt: data?.lastUpdatedAt,
  //     currentExchangeInfo: data?.exchangeInfo?.[baseCurrency],
  //     triggerExchangeRate,
  //   }),
  //   [isFetching, data, baseCurrency, isLoading, error, triggerExchangeRate],
  // );
};
