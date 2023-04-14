import useSWR from "swr";
import { arrayURLFetcher, getTotalVolumeSum } from "lib/legacy";
import { DEFAULT_CHAIN_ID } from "config/chains";
import { getServerUrlNew } from "config/backend";
import { bigNumberify } from "lib/numbers";
const ACTIVE_CHAIN_IDS = [DEFAULT_CHAIN_ID];

export default function useTotalVolume() {
  const { data: totalVolume } = useSWR<any>(
    ACTIVE_CHAIN_IDS.map((chainId) => getServerUrlNew(chainId, `/total_volume?chain_id=${chainId}`)),
    {
      fetcher: arrayURLFetcher,
    }
  );

  if (totalVolume?.length > 0) {
    return ACTIVE_CHAIN_IDS.reduce((acc, chainId, index) => {
        const sum = getTotalVolumeSum(totalVolume[index])!;
        if (sum) {
          acc[chainId] = sum;
          acc.total = acc.total.add(sum);
        }
        return acc;
      },
      { total: bigNumberify(0)! }
    );
  }
}
