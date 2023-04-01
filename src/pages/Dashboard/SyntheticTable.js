import { Trans } from "@lingui/macro";
import { BASIS_POINTS_DIVISOR, DEFAULT_MAX_USDG_AMOUNT, importImage, USD_DECIMALS } from "lib/legacy";
import { bigNumberify, formatAmount, formatKeyAmount } from "lib/numbers";
import "./DashboardV2.css";

export default function SyntheticTable({visibleTokens,infoTokens,getWeightText, syntheticCollateralAmounts}) {
  let usdcInfo;
  for (let idx in infoTokens){
    if (infoTokens[idx].symbol.toLowerCase() === "usdc"){
      usdcInfo = infoTokens[idx]
    }
  }

  return (
      <div className="token-table-wrapper App-card mt20">
            <div className="App-card-title">
              <Trans>Synthetic Assets backed by USDC</Trans>
            </div>
            <div className="App-card-divider"></div>
            <table className="token-table">
              <thead>
                <tr>
                  <th>
                    <Trans>TOKEN</Trans>
                  </th>
                  <th>
                    <Trans>PRICE</Trans>
                  </th>
                  <th>
                    <Trans>Size</Trans>
                  </th>
                  <th>
                    <Trans>Collateral</Trans>
                  </th>
                  <th>
                    <Trans>USDC ASSET OCCUPANCY</Trans>
                  </th>
                  <th>
                    <Trans>USDC PROPORTION</Trans>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleTokens.filter(t=>t.isSynthetic).map((token, idx) => {
                  const tokenInfo = infoTokens[token.address];
                  let utilization = bigNumberify(0);
                  if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
                    utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
                  }
                  let maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
                  if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
                    maxUsdgAmount = tokenInfo.maxUsdgAmount;
                  }
                  const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_40.png");

                  let size = 0, Collateral=0,OCCUPANCY=0,PROPORTION=0,minPriceTmp=0;
                  if (syntheticCollateralAmounts && syntheticCollateralAmounts[idx]){
                    Collateral = formatAmount(syntheticCollateralAmounts[idx], usdcInfo.decimals, tokenInfo.displayPricePrecision)
                    minPriceTmp = formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, tokenInfo.displayPricePrecision, false)
                    Collateral = parseFloat(Collateral, 6)*parseFloat(minPriceTmp);
                    size = parseFloat(Collateral) + parseFloat(formatKeyAmount(tokenInfo, "guaranteedUsd", USD_DECIMALS, tokenInfo.displayPricePrecision, false))
                    OCCUPANCY = (size - Collateral) / parseFloat(formatAmount(usdcInfo.poolAmount, usdcInfo.decimals, 2)) * 100
                    PROPORTION = size/parseFloat(formatAmount(usdcInfo.poolAmount, usdcInfo.decimals, 2)) * 100
                  }

                  return (
                    <tr key={token.symbol}>
                      <td>
                        <div className="token-symbol-wrapper">
                          <div className="App-card-title-info">
                            <div className="App-card-title-info-icon">
                              <img src={tokenImage} alt={token.symbol} width="40" />
                            </div>
                            <div className="App-card-title-info-text">
                              <div className="App-card-info-title">{token.name}</div>
                              <div className="App-card-info-subtitle">{token.symbol}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, tokenInfo.displayPricePrecision, true)}</td>
                      <td>${size.toFixed(2)}</td>
                      <td>
                        ${Collateral.toFixed(tokenInfo.displayPricePrecision)}
                      </td>
                      <td>{OCCUPANCY.toFixed(4)}%</td>
                      <td>{PROPORTION.toFixed(4)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
  )
}
