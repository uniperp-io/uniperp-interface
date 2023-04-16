import "./Hyper.css"
import { contractFetcher } from "lib/contracts";
import ReaderV2 from "abis/ReaderV2.json";
import SEO from "components/Common/SEO";
import { getPageTitle, GLP_DECIMALS} from "lib/legacy";
import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import { getContract } from "config/contracts";
import { ethers } from "ethers";
import { useChainId } from "lib/chains";
import { formatAmount } from "../../lib/numbers";
import { Trans } from "@lingui/macro";
import React from "react";
import Tooltip from "components/Tooltip/Tooltip";
import { GMX_DECIMALS } from "../../lib/legacy";
const { AddressZero } = ethers.constants;

export default function Hyper() {
  const {library, active} = useWeb3React()
  const {chainId} = useChainId()
  const readerAddress = getContract(chainId, "Reader");

  const ulpAddress = getContract(chainId, "GLP");
  const unippAddress = getContract(chainId, "GMX");
  const tokensForSupplyQuery = [ulpAddress, unippAddress];

  const { data: totalSupplies } = useSWR(
    [`Dashboard:totalSupplies:${active}`, chainId, readerAddress, "getTokenBalancesWithSupplies", AddressZero],
    {
      fetcher: contractFetcher(library, ReaderV2, [tokensForSupplyQuery]),
    }
  );

  let ulpSupply;
  let unipSupply;
  if (totalSupplies && totalSupplies[1]) {
    ulpSupply = totalSupplies[1];
    unipSupply = totalSupplies[3];
  }

  const tierLists = [
    {index:1, filled:500000, rate:"0.500", isPass:false},
    {index:2, filled:1500000, rate:"0.375", isPass:false},
    {index:3, filled:3000000, rate:"0.333", isPass:false},
    {index:4, filled:5000000, rate:"0.250", isPass:false},
    {index:5, filled:7500000, rate:"0.200", isPass:false},
    {index:6, filled:10000000, rate:"0.150", isPass:false},
  ];

  const getText = (filled) =>{
    return (filled/1000) + '.0K'
  }

  const nowUlpSupply = parseInt(formatAmount(ulpSupply, GLP_DECIMALS, 0, false, 0))
  const nowUnipSupply = parseInt(formatAmount(unipSupply, GMX_DECIMALS, 0, false, 0))

  const currentTier = (tierLists, glpSupply)=>{
    if (!glpSupply){
      return tierLists[0]
    }
    for (const idx in tierLists){
      const item = tierLists[idx]
      if (item.filled > nowUlpSupply){
        return tierLists[idx]
      }
    }
    return tierLists[0]
  }

  const tmpCurrentTier = currentTier(tierLists, ulpSupply)

  const sumLine = (item, nowUlpSupply) => {
    const isFilled = item.filled < nowUlpSupply;
    if (isFilled || item.isPass){
      return (<div className="line" style={{ width: "100%" }}/>)
    }

    let t = ((nowUlpSupply / item.filled)*100).toFixed(2)
    t = t > 100 ? 100 : t;
    return (<div className="line" style={{ width: `${t}%` }}>
      <Tooltip
        handle={`${t}%`}
        position="left-bottom"
        renderContent={() => {
          return (
            <Trans>UlpSupply: {nowUlpSupply}</Trans>
          );
        }}
      />
    </div>)
  }

  return (
    <SEO title={getPageTitle("Uniperp")}>
      <div className="main_body">
      <div>
        <h1>Hyper ULP Rewards</h1>
        <h3>Earn high APR bonus rewards for minting early</h3>
      </div>

      <div className="pre_cardinfo">
        {/*<div>*/}
        {/*  <h4>Hyper ULP has ended, but you can still obtain up to 0.0% APR by minting and staking ULP</h4>*/}
        {/*</div>*/}

        <div className="cardinfo">
          <h2>Hyper ULP Event</h2>
          <div className="card_block">
            {tierLists.map((item, idx)=>{
              return(
                <div className="card_item" key={idx}>
                  <div className={`card_header ${item.index === tmpCurrentTier.index || item.isPass ? 'active' : 'default'}`}>
                    <div className="inblock left">Tier{item.index}</div>
                    <div className="inblock right">
                      <div>{getText(item.filled)} Filled</div>
                      {item.index === tmpCurrentTier.index ? (
                        <div className="disline">{sumLine(item, nowUlpSupply)}</div>
                      ):(
                        <div className="disline"></div>
                      )}
                    </div>
                  </div>
                  <div className={`info_list ${item.index === tmpCurrentTier.index ? 'lactive' : ''}`}>
                    <div>
                      <div className="left">ULP</div>
                      <div className="right">{getText(item.filled)}</div>
                    </div>
                    <div>
                      <div className="left">APR</div>
                      <div className="right">Reward rate (UNIP/ULP)</div>
                    </div>
                    <div>
                      <div className="left">220.2%</div>
                      <div className="right">{item.rate.toString()}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="your_cardinfo">
          <div className="your">
            <h2>Your Hyper Rewards Details</h2>
            <div className="list_item">
              <div className="item">
                <div className="inblock left">APR</div>
                <div className="inblock right">0.0%</div>
              </div>
              <div className="item">
                <div className="inblock left">ULP Amount</div>
                <div className="inblock right">0</div>
              </div>
              <div className="item">
                <div className="inblock left">USDC Staked</div>
                <div className="inblock right">0</div>
              </div>
            </div>
            <div className="contribution">
              <h2>Contribution</h2>
              <div className="table">
                <div>Tier</div>
                <div>Vested VELA</div>
                <div>USDC Committed</div>
                <div>Total VLP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </SEO>
  )
}
