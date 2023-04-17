import { getContract } from "config/contracts";
import useSWR from "swr";
import { contractFetcher } from "lib/contracts";
import VaultReader from "abis/VaultReader.json";
import {
  BASIS_POINTS_DIVISOR,
  DEFAULT_MAX_USDG_AMOUNT,
  MAX_PRICE_DEVIATION_BASIS_POINTS,
  USD_DECIMALS,
  USDG_ADDRESS,
} from "lib/legacy";
import { getServerUrlNew } from "config/backend";
import { InfoTokens, Token, TokenInfo } from "./types";
import { BigNumber } from "ethers";
import { bigNumberify, expandDecimals } from "lib/numbers";
import { getTokens, getWhitelistedTokens } from "config/tokens";
import { Web3Provider } from "@ethersproject/providers";
import VauUilts from "abis/VaultUtils.json";
import PositionManager from "abis/PositionManager.json";
import Vault from "abis/Vault.json";

export function useInfoTokens(
  library: Web3Provider,
  chainId: number,
  active: boolean,
  tokenBalances?: BigNumber[],
  fundingRateInfo?: BigNumber[],
  vaultPropsLength?: number
) {
  const tokens = getTokens(chainId);
  const vaultReaderAddress = getContract(chainId, "VaultReader");
  const vaultAddress = getContract(chainId, "Vault");
  const positionRouterAddress = getContract(chainId, "PositionRouter");
  const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");

  let whitelistedTokens = getWhitelistedTokens(chainId).map((t)=> {
    t.isTradeable=true
    return t
  });

  const whitelistedTokenAddresses = whitelistedTokens.map((token) => token.address);

  const { data: vaultTokenInfo } = useSWR<BigNumber[], any>(
    [`useInfoTokens:${active}`, chainId, vaultReaderAddress, "getVaultTokenInfoV4"],
    {
      fetcher: contractFetcher(library, VaultReader, [
        vaultAddress,
        positionRouterAddress,
        nativeTokenAddress,
        expandDecimals(1, 18),
        whitelistedTokenAddresses,
      ]),
    }
  );

  const indexPricesUrl = getServerUrlNew(chainId, `/targetprices?chainId=${chainId}`);
  const { data: indexPrices } = useSWR([indexPricesUrl], {
    // @ts-ignore spread args incorrect type
    fetcher: (...args) => fetch(...args).then((res) => res.json()),
    refreshInterval: 500,
    refreshWhenHidden: true,
  });


  const vaultUtilAddress = getContract(chainId, "vaultUtils");
  const { data: isCanTrades } = useSWR([active, chainId, vaultUtilAddress, "isTradableBatch"], {
    fetcher: contractFetcher(library, VauUilts, [whitelistedTokenAddresses]),
  });

  let isCanTradesTmp:boolean[]
  if (isCanTrades){
    isCanTradesTmp= JSON.parse(JSON.stringify(isCanTrades));
    whitelistedTokens = whitelistedTokens.map((t, i) => {
      t.isTradeable = isCanTradesTmp[i]
      return t
    })

    whitelistedTokens = whitelistedTokens.map((t) => {
      if (t.symbol.toLowerCase() === "eth"){
        for (let i = 0; i < whitelistedTokens.length; i++){
          if(whitelistedTokens[i].symbol.toLowerCase() === "weth"){
            t.isTradeable = whitelistedTokens[i].isTradeable;
          }
        }
      }
      return t
    })
  }

  const positionManagerAddress = getContract(chainId, "PositionManager");
  const { data: syntheticTotalGuaranteedUsd } = useSWR([active, chainId, positionManagerAddress, "getSyntheticTotalGuaranteedUsd"], {
    fetcher: contractFetcher(library, PositionManager),
  });
  const { data: syntheticTotalGlobalShortSizes } = useSWR([active, chainId, positionManagerAddress, "getSyntheticTotalGlobalShortSizes"], {
    fetcher: contractFetcher(library, PositionManager),
  });
  const { data: usdcSharesForSyntheticAsset } = useSWR([active, chainId, vaultAddress, "usdcSharesForSyntheticAsset"], {
    fetcher: contractFetcher(library, Vault),
  });
  const syntheticTotalSizeLimitInfo = {"longTotalUsd": syntheticTotalGuaranteedUsd, 
                                      "shortTotalUsd": syntheticTotalGlobalShortSizes,
                                      "usdcSharesForSyntheticAsset": usdcSharesForSyntheticAsset};

  return {
    infoTokens: getInfoTokens(
      tokens,
      tokenBalances,
      whitelistedTokens,
      vaultTokenInfo,
      fundingRateInfo,
      vaultPropsLength,
      indexPrices,
      nativeTokenAddress,
      syntheticTotalSizeLimitInfo
    ),
  };
}

function getInfoTokens(
  tokens: Token[],
  tokenBalances: BigNumber[] | undefined,
  whitelistedTokens: Token[],
  vaultTokenInfo: BigNumber[] | undefined,
  fundingRateInfo: BigNumber[] | undefined,
  vaultPropsLength: number | undefined,
  indexPrices: { [address: string]: BigNumber },
  nativeTokenAddress: string,
  syntheticTotalSizeLimitInfo: any,
): InfoTokens {
  if (!vaultPropsLength) {
    vaultPropsLength = 15;
  }
  const fundingRatePropsLength = 2;
  const infoTokens: InfoTokens = {};

  let usdcTokenRaw;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].symbol == "USDC") {
      usdcTokenRaw = tokens[i];
      break;
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = JSON.parse(JSON.stringify(tokens[i])) as TokenInfo;

    if (tokenBalances) {
      token.balance = tokenBalances[i];
    }

    if (token.address === USDG_ADDRESS) {
      token.minPrice = expandDecimals(1, USD_DECIMALS);
      token.maxPrice = expandDecimals(1, USD_DECIMALS);
    }

    infoTokens[token.address] = token;
  }

  for (let i = 0; i < whitelistedTokens.length; i++) {
    const token = JSON.parse(JSON.stringify(whitelistedTokens[i])) as TokenInfo;

    if (vaultTokenInfo) {
      token.poolAmount = vaultTokenInfo[i * vaultPropsLength];
      token.reservedAmount = vaultTokenInfo[i * vaultPropsLength + 1];
      token.availableAmount = token.poolAmount.sub(token.reservedAmount);
      token.usdgAmount = vaultTokenInfo[i * vaultPropsLength + 2];
      token.redemptionAmount = vaultTokenInfo[i * vaultPropsLength + 3];
      token.weight = vaultTokenInfo[i * vaultPropsLength + 4];
      token.bufferAmount = vaultTokenInfo[i * vaultPropsLength + 5];
      token.maxUsdgAmount = vaultTokenInfo[i * vaultPropsLength + 6];
      token.globalShortSize = vaultTokenInfo[i * vaultPropsLength + 7];
      token.maxGlobalShortSize = vaultTokenInfo[i * vaultPropsLength + 8];
      token.maxGlobalLongSize = vaultTokenInfo[i * vaultPropsLength + 9];
      token.minPrice = vaultTokenInfo[i * vaultPropsLength + 10];
      token.maxPrice = vaultTokenInfo[i * vaultPropsLength + 11];
      token.guaranteedUsd = vaultTokenInfo[i * vaultPropsLength + 12];
      token.maxPrimaryPrice = vaultTokenInfo[i * vaultPropsLength + 13];
      token.minPrimaryPrice = vaultTokenInfo[i * vaultPropsLength + 14];

      // save minPrice and maxPrice as setTokenUsingIndexPrices may override it
      token.contractMinPrice = token.minPrice;
      token.contractMaxPrice = token.maxPrice;

      if (!token.isSynthetic) {
        token.maxAvailableShort = bigNumberify(0)!;

        token.hasMaxAvailableShort = false;
        if (token.maxGlobalShortSize.gt(0)) {
          token.hasMaxAvailableShort = true;
          if (token.maxGlobalShortSize.gt(token.globalShortSize)) {
            token.maxAvailableShort = token.maxGlobalShortSize.sub(token.globalShortSize);
          }
        }
  
        if (token.maxUsdgAmount.eq(0)) {
          token.maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
        }
  
        token.availableUsd = token.isStable
          ? token.poolAmount.mul(token.minPrice).div(expandDecimals(1, token.decimals))
          : token.availableAmount.mul(token.minPrice).div(expandDecimals(1, token.decimals));
  
        token.maxAvailableLong = bigNumberify(0)!;
        token.hasMaxAvailableLong = false;
        if (token.maxGlobalLongSize.gt(0)) {
          token.hasMaxAvailableLong = true;
  
          if (token.maxGlobalLongSize.gt(token.guaranteedUsd)) {
            const remainingLongSize = token.maxGlobalLongSize.sub(token.guaranteedUsd);
            token.maxAvailableLong = remainingLongSize.lt(token.availableUsd) ? remainingLongSize : token.availableUsd;
          }
        } else {
          token.maxAvailableLong = token.availableUsd;
        }
  
        token.maxLongCapacity =
          token.maxGlobalLongSize.gt(0) && token.maxGlobalLongSize.lt(token.availableUsd.add(token.guaranteedUsd))
            ? token.maxGlobalLongSize
            : token.availableUsd.add(token.guaranteedUsd);
  
        token.managedUsd = token.availableUsd.add(token.guaranteedUsd);
        token.managedAmount = token.managedUsd.mul(expandDecimals(1, token.decimals)).div(token.minPrice);
  
        setTokenUsingIndexPrices(token, indexPrices, nativeTokenAddress);
      }
    }

    if (fundingRateInfo) {
      token.fundingRate = fundingRateInfo[i * fundingRatePropsLength];
      token.cumulativeFundingRate = fundingRateInfo[i * fundingRatePropsLength + 1];
    }

    if (infoTokens[token.address]) {
      token.balance = infoTokens[token.address].balance;
    }

    infoTokens[token.address] = token;
  }

  const usdcToken = infoTokens[usdcTokenRaw.address]
  for (let i = 0; i < whitelistedTokens.length; i++) {
    const token = infoTokens[whitelistedTokens[i].address];
    if (!token.isSynthetic) {
      continue;
    }

    setInfoForSyntheticToken(token, syntheticTotalSizeLimitInfo, usdcToken);
    //TODO when open, page crash, oops...
    //setTokenUsingIndexPrices(token, indexPrices, nativeTokenAddress);

    infoTokens[token.address] = token;
  }

  return infoTokens;
}

//experimental, when stable, merge to getInfoTokens function
function setInfoForSyntheticToken(token: TokenInfo, syntheticTotalSizeLimitInfo: any, usdcToken: TokenInfo) {
  token.maxAvailableShort = bigNumberify(0)!;
  token.managedUsd = bigNumberify(0)!;
  token.managedAmount = bigNumberify(0)!;

  if (!usdcToken.availableUsd) {
    return;
  }

  //console.log("syntheticTotalGlobalSize: ", syntheticTotalSizeLimitInfo);
  let availableUsd = usdcToken.availableUsd.mul(bigNumberify(20)!).div(bigNumberify(100)!);
  if ("usdcSharesForSyntheticAsset" in syntheticTotalSizeLimitInfo) {
    const usdcSharesForSyntheticAsset = syntheticTotalSizeLimitInfo["usdcSharesForSyntheticAsset"] || bigNumberify(0)!;
    if (usdcSharesForSyntheticAsset.gt(0)) {
      availableUsd = usdcToken.availableUsd.mul(usdcSharesForSyntheticAsset).div(bigNumberify(BASIS_POINTS_DIVISOR)!);
    }
  }

  if ("longTotalUsd" in syntheticTotalSizeLimitInfo) {
    const syntheticTotalGuaranteedUsd = syntheticTotalSizeLimitInfo["longTotalUsd"] || bigNumberify(0)!;
    availableUsd = availableUsd.sub(syntheticTotalGuaranteedUsd);
  }
  
  if ("shortTotalUsd" in syntheticTotalSizeLimitInfo) {  
    const syntheticTotalGlobalShortSizes = syntheticTotalSizeLimitInfo["shortTotalUsd"] || bigNumberify(0)!;
    availableUsd = availableUsd.sub(syntheticTotalGlobalShortSizes);
    //console.log("availableUsd is 0!");
  }
  token.availableUsd = availableUsd;

  //console.log("availableUsd is: ", token.availableUsd, token.name);
  token.maxAvailableLong = bigNumberify(0)!;
  token.hasMaxAvailableLong = false;
  if (token.maxGlobalLongSize!.gt(0)) {
    token.hasMaxAvailableLong = true;
    if (token.maxGlobalLongSize!.gt(token.guaranteedUsd!)) {
      const remainingLongSize = token.maxGlobalLongSize!.sub(token.guaranteedUsd!);
      token.maxAvailableLong = remainingLongSize.lt(token.availableUsd) ? remainingLongSize : token.availableUsd;
    }
  } else {
    token.hasMaxAvailableLong = true;
    token.maxAvailableLong = token.availableUsd;
  }
  //console.log("maxAvailableLong is: ", token.maxAvailableLong, token.name);

  token.hasMaxAvailableShort = false;
  if (token.maxGlobalShortSize!.gt(0)) {
    token.hasMaxAvailableShort = true;
    if (token.maxGlobalShortSize!.gt(token.globalShortSize!)) {
      const remainingLongSize = token.maxGlobalShortSize!.sub(token.globalShortSize!);
      token.maxAvailableShort = remainingLongSize.lt(token.availableUsd) ? remainingLongSize : token.availableUsd;
    }
  } else {
    token.hasMaxAvailableShort = true;
    token.maxAvailableShort = token.availableUsd;
  }
  //console.log("maxAvailableShort is: ", token.maxAvailableShort, token.name);

  token.maxLongCapacity =
  token.maxGlobalLongSize!.gt(0) && token.maxGlobalLongSize!.lt(token.availableUsd.add(token.guaranteedUsd!))
    ? token.maxGlobalLongSize!
    : token.availableUsd.add(token.guaranteedUsd!);
  //console.log("maxLongCapacity is: ", token.maxLongCapacity, token.name);
}

function setTokenUsingIndexPrices(
  token: TokenInfo,
  indexPrices: { [address: string]: BigNumber },
  nativeTokenAddress: string
) {
  if (!indexPrices) {
    return;
  }

  const tokenAddress = token.isNative ? nativeTokenAddress : token.address;

  const indexPrice = indexPrices[tokenAddress];

  if (!indexPrice) {
    return;
  }

  const indexPriceBn = bigNumberify(indexPrice)!;

  if (indexPriceBn.eq(0)) {
    return;
  }

  const spread = token.maxPrice!.sub(token.minPrice!);
  const spreadBps = spread.mul(BASIS_POINTS_DIVISOR).div(token.maxPrice!.add(token.minPrice!).div(2));

  if (spreadBps.gt(MAX_PRICE_DEVIATION_BASIS_POINTS - 50)) {
    // only set one of the values as there will be a spread between the index price and the Chainlink price
    if (indexPriceBn.gt(token.minPrimaryPrice!)) {
      token.maxPrice = indexPriceBn;
    } else {
      token.minPrice = indexPriceBn;
    }
    return;
  }

  const halfSpreadBps = spreadBps.div(2).toNumber();
  token.maxPrice = indexPriceBn.mul(BASIS_POINTS_DIVISOR + halfSpreadBps).div(BASIS_POINTS_DIVISOR);
  token.minPrice = indexPriceBn.mul(BASIS_POINTS_DIVISOR - halfSpreadBps).div(BASIS_POINTS_DIVISOR);
}
