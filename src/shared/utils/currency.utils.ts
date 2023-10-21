import {
  CurrencyResponseType,
  CurrencyType,
  ExchangeRateResponseType,
} from 'shared/api';

import { getFormattedDate } from './date.utils';

/**
 * Convert currencies list from API to acceptable object with label property.
 *
 * @property {array} currenciesList
 */
export const getCurrencyOptions = (currenciesList: CurrencyResponseType[]) =>
  currenciesList.map(({ code, name, name_plural, symbol }) => ({
    code,
    name,
    namePlural: name_plural,
    symbol,
    label: `${symbol} ${name} (${code})`,
  }));

/**
 * Return plural name for currency.
 *
 * @property {object} currency
 * @property {number} amount
 */
export const getCurrencyPluralName = (currency: CurrencyType, amount: number) =>
  amount === 1 ? currency.name : currency.namePlural;

/**
 * Return text information about currencies after converting.
 *
 * @property {number} amount
 * @property {object} fromCurrency
 * @property {object} toCurrency
 * @property {string} lastUpdatedAt
 * @property {string} currentExchangeInfo
 */
export const getConvertedCurrenciesInfo = ({
  amount,
  fromCurrency,
  toCurrency,
  lastUpdatedAt = '',
  currentExchangeInfo,
}: {
  amount: number;
  fromCurrency?: CurrencyType;
  toCurrency?: CurrencyType;
  lastUpdatedAt?: string;
  currentExchangeInfo?: ExchangeRateResponseType[];
}) => {
  const exchangeRate = currentExchangeInfo?.find(
    (c) => c.code === toCurrency?.code,
  )?.value;

  if (!exchangeRate || !lastUpdatedAt || !fromCurrency || !toCurrency) {
    return;
  }

  const lastUpdate = getFormattedDate(lastUpdatedAt);

  const fromCurrencyText = `${amount || 0} ${getCurrencyPluralName(
    fromCurrency,
    amount,
  )}`;

  const convertedAmount = (amount * exchangeRate).toFixed(5);

  const toCurrencyText = `${convertedAmount} ${getCurrencyPluralName(
    toCurrency,
    exchangeRate,
  )}`;

  return {
    toCurrencyText,
    fromCurrencyText,
    lastUpdate,
  };
};
