import useSWR from "swr";
import { arrayURLFetcher } from "lib/legacy";
import { getServerUrlNew } from "config/backend";
import { DEFAULT_CHAIN_ID } from "config/chains";

export default function useFeesSummary() {
  const ACTIVE_CHAIN_IDS = [DEFAULT_CHAIN_ID];

  const { data: feesSummary } = useSWR(
    ACTIVE_CHAIN_IDS.map((chainId) => getServerUrlNew(chainId, `/fees_summary?chain_id=${chainId}`)),
    {
      fetcher: arrayURLFetcher,
    }
  );

  const feesSummaryByChain = {};
  for (let i = 0; i < ACTIVE_CHAIN_IDS.length; i++) {
    if (feesSummary && feesSummary.length === ACTIVE_CHAIN_IDS.length) {
      feesSummaryByChain[ACTIVE_CHAIN_IDS[i]] = feesSummary[i];
    } else {
      feesSummaryByChain[ACTIVE_CHAIN_IDS[i]] = {};
    }
  }

  return { data: feesSummaryByChain };
}
