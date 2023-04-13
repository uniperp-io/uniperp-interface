import { Trans } from "@lingui/macro";
import { BASIS_POINTS_DIVISOR, DEFAULT_MAX_USDG_AMOUNT, importImage, USD_DECIMALS, fetchMulticallData } from "lib/legacy";
import { bigNumberify, formatAmount, formatKeyAmount } from "lib/numbers";
import "./DashboardV2.css";

export default function SyntheticTable({visibleTokens,infoTokens, syntheticCollateralAmounts, globalShortSizes}) {
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
                    <Trans>USDC ASSET</Trans>
                  </th>
                  <th>
                    <Trans>USDC PROPORTION</Trans>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleTokens.filter(t=>t.isSynthetic).map((token, idx) => {
                  const tokenInfo = infoTokens[token.address];
                  const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_40.png");

                  let size=0,PROPORTION=0;
                  if (syntheticCollateralAmounts && globalShortSizes){
                    const guaranteedUsd = parseFloat(formatKeyAmount(tokenInfo, "guaranteedUsd", USD_DECIMALS, tokenInfo.displayDecimals, false))
                    const amount = parseFloat(formatAmount(syntheticCollateralAmounts[idx], usdcInfo.decimals, tokenInfo.displayDecimals))
                    const shortSize = parseFloat(formatAmount(globalShortSizes[idx], USD_DECIMALS, tokenInfo.displayDecimals))
                    const usdcPrice = parseFloat(formatKeyAmount(usdcInfo, "minPrice", USD_DECIMALS, tokenInfo.displayDecimals, false))
                    size = guaranteedUsd + amount * usdcPrice + shortSize;
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
                      <td>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, tokenInfo.displayDecimals, true)}</td>
                      <td>${size.toFixed(2)}</td>
                      <td>{`$${formatAmount(usdcInfo.poolAmount, usdcInfo.decimals, 0)}`}</td>
                      <td>{PROPORTION.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
  )
}
