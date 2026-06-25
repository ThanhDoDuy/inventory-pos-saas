import useSWR from 'swr';
import { API_BASE_URL, swrFetcher as fetcher } from '@/lib/api-client';

export interface TaxReportRow {
  date: string;
  label: string;
  count: number;
  amount: number;
}

export interface TaxReportHeader {
  business_name: string;
  tax_code: string;
  business_location: string;
  period: string;
}

export interface TaxReportData {
  header: TaxReportHeader;
  rows: TaxReportRow[];
  total: number;
}

export function useTaxS1aHkd(year: number) {
  const { data, error, isLoading, mutate } = useSWR<TaxReportData>(
    `${API_BASE_URL}/reports/tax/s1a-hkd?year=${year}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  return { data, error, isLoading, mutate };
}
