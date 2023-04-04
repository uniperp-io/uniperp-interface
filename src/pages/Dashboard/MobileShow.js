import { Trans, t } from "@lingui/macro";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import { BASIS_POINTS_DIVISOR, DEFAULT_MAX_USDG_AMOUNT, importImage, USD_DECIMALS } from "lib/legacy";
import { bigNumberify, formatAmount, formatKeyAmount } from "lib/numbers";
import TooltipComponent from "components/Tooltip/Tooltip";
import "./DashboardV2.css";
import AssetDropdown from "./AssetDropdown";
import React from "react";

export default function MobileShow({visibleTokens, infoTokens, getWeightText, syntheticCollateralAmounts, globalShortSizes}) {
  let usdcInfo;
  for (let idx in infoTokens){
    if (infoTokens[idx].symbol.toLowerCase() === "usdc"){
      usdcInfo = infoTokens[idx]
    }
  }

  return (
    <>
    <div className="token-grid">
      {visibleTokens.filter(t=>!t.isSynthetic).map((token) => {
        const tokenInfo = infoTokens[token.address];
        let utilization = bigNumberify(0);
        if (tokenInfo && tokenInfo.reservedAmount && tokenInfo.poolAmount && tokenInfo.poolAmount.gt(0)) {
          utilization = tokenInfo.reservedAmount.mul(BASIS_POINTS_DIVISOR).div(tokenInfo.poolAmount);
        }
        let maxUsdgAmount = DEFAULT_MAX_USDG_AMOUNT;
        if (tokenInfo.maxUsdgAmount && tokenInfo.maxUsdgAmount.gt(0)) {
          maxUsdgAmount = tokenInfo.maxUsdgAmount;
        }

        const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_24.svg");
        return (
          <div className="App-card" key={token.symbol}>
            <div className="App-card-title">
              <div className="mobile-token-card">
                <img src={tokenImage} alt={token.symbol} width="20px" />
                <div className="token-symbol-text">{token.symbol}</div>
                <div>
                  <AssetDropdown assetSymbol={token.symbol} assetInfo={token} />
                </div>
              </div>
            </div>
            <div className="App-card-divider"></div>
            <div className="App-card-content">
              <div className="App-card-row">
                <div className="label">
                  <Trans>Price</Trans>
                </div>
                <div>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, 2, true)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Pool</Trans>
                </div>
                <div>
                  <TooltipComponent
                    handle={`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 0, true)}`}
                    position="right-bottom"
                    renderContent={() => {
                      return (
                        <>
                          <StatsTooltipRow
                            label={t`Pool Amount`}
                            value={`${formatKeyAmount(tokenInfo, "managedAmount", token.decimals, 0, true)} ${
                              token.symbol
                            }`}
                            showDollar={false}
                          />
                          <StatsTooltipRow
                            label={t`Target Min Amount`}
                            value={`${formatKeyAmount(tokenInfo, "bufferAmount", token.decimals, 0, true)} ${
                              token.symbol
                            }`}
                            showDollar={false}
                          />
                          <StatsTooltipRow
                            label={t`Max ${tokenInfo.symbol} Capacity`}
                            value={formatAmount(maxUsdgAmount, 18, 0, true)}
                          />
                        </>
                      );
                    }}
                  />
                </div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Weight</Trans>
                </div>
                <div>{getWeightText(tokenInfo)}</div>
              </div>
              <div className="App-card-row">
                <div className="label">
                  <Trans>Utilization</Trans>
                </div>
                <div>{formatAmount(utilization, 2, 2, false)}%</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <div className="token-grid">
        {visibleTokens.filter(t=>t.isSynthetic).map((token, idx) => {
          const tokenInfo = infoTokens[token.address];

          let size=0,PROPORTION=0;
          if (syntheticCollateralAmounts && globalShortSizes){
            const guaranteedUsd = parseFloat(formatKeyAmount(tokenInfo, "guaranteedUsd", USD_DECIMALS, tokenInfo.displayPricePrecision, false))
            const amount = parseFloat(formatAmount(syntheticCollateralAmounts[idx], usdcInfo.decimals, tokenInfo.displayPricePrecision))
            const shortSize = parseFloat(formatAmount(globalShortSizes[idx], USD_DECIMALS, tokenInfo.displayPricePrecision))
            const usdcPrice = parseFloat(formatKeyAmount(usdcInfo, "minPrice", USD_DECIMALS, tokenInfo.displayPricePrecision, false))
            size = guaranteedUsd + amount * usdcPrice + shortSize;
            const usdcAsset = formatAmount(tokenInfo.managedUsd, USD_DECIMALS, tokenInfo.displayPricePrecision);
            PROPORTION = size/parseFloat(usdcAsset) * 100
          }

          const tokenImage = importImage("ic_" + token.symbol.toLowerCase() + "_24.svg");
          return (
            <div className="App-card" key={token.symbol}>
              <div className="App-card-title">
                <div className="mobile-token-card">
                  <img src={tokenImage} alt={token.symbol} width="20px" />
                  <div className="token-symbol-text">{token.symbol}</div>
                </div>
              </div>
              <div className="App-card-divider"></div>
              <div className="App-card-content">
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Price</Trans>
                  </div>
                  <div>${formatKeyAmount(tokenInfo, "minPrice", USD_DECIMALS, tokenInfo.displayPricePrecision, true)}</div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>Size</Trans>
                  </div>
                  <div>${size.toFixed(2)}</div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>USDC ASSET</Trans>
                  </div>
                  <div>{`$${formatKeyAmount(tokenInfo, "managedUsd", USD_DECIMALS, 2, true)}`}</div>
                </div>
                <div className="App-card-row">
                  <div className="label">
                    <Trans>USDC PROPORTION</Trans>
                  </div>
                  <div>{PROPORTION.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  )
}
