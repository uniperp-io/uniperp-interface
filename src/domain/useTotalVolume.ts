import useSWR from "swr";
import { arrayURLFetcher, getTotalVolumeSum } from "lib/legacy";
import { ARBITRUM } from "config/chains";
import { getServerUrlNew } from "config/backend";
import { bigNumberify } from "lib/numbers";
const ACTIVE_CHAIN_IDS = [ARBITRUM];

export default function useTotalVolume() {
  const { data: totalVolume } = useSWR<any>(
    ACTIVE_CHAIN_IDS.map((chain) => getServerUrlNew(chain, `/total_volume?chain_id=${ARBITRUM}`)),
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
