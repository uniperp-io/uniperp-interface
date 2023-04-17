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
import { formatAmount } from "lib/numbers";
import { Trans } from "@lingui/macro";
import React, { useEffect, useState } from "react";
import Tooltip from "components/Tooltip/Tooltip";
import { GMX_DECIMALS, isMobileDevice } from "lib/legacy";
import { getServerUrlNew } from "config/backend";
const { AddressZero } = ethers.constants;

export default function Hyper({userOnMobileDevice}) {
  const {library, active, account} = useWeb3React()
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
    {index:1, filled:500000, rate:"0.500", isPass:false, apr:"200%"},
    {index:2, filled:1500000, rate:"0.375", isPass:false, apr:"150%"},
    {index:3, filled:3000000, rate:"0.333", isPass:false, apr:"133%"},
    {index:4, filled:5000000, rate:"0.250", isPass:false, apr:"100%"},
    {index:5, filled:7500000, rate:"0.200", isPass:false, apr:"80%"},
    {index:6, filled:10000000, rate:"0.150", isPass:false, apr:"60%"},
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
    return (<div className="line" style={{ width: `${t}%` }}/>)
  }

  const [superUlp, setSuperUlp] = useState({account:"", details:[]})
  useEffect(()=>{
    async function fetData(){
      const url = getServerUrlNew(chainId, `/superulp_details?chain_id=${chainId}&account=${account}`);
      try {
        const response = await fetch(url)
        const data = await response.json().then(t=>t);
        setSuperUlp(data)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(`Error fetching data: ${error}`);
      }
    }

    account && fetData()
  }, [account, chainId]);

  const formatDate = (timestamp, isShort)=>{
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    if(isShort)
      return `${year}-${month}-${day}`
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  const getFilledNum = (item, tmpCurrentTier)=>{
    if (item.index <= tmpCurrentTier.index){
      if (tmpCurrentTier.index === 1){
        return nowUlpSupply
      }
    }
    return 0;
  }

  return (
    <SEO title={getPageTitle("Uniperp")}>
      <div className="main_body">
      <div>
        <h1>Super ULP Rewards</h1>
        <h3>Earn high APR bonus rewards for minting early</h3>
      </div>

      <div className="pre_cardinfo">
        {/*<div>*/}
        {/*  <h4>Hyper ULP has ended, but you can still obtain up to 0.0% APR by minting and staking ULP</h4>*/}
        {/*</div>*/}

        <div className="cardinfo">
          <h2>Super ULP Event</h2>
          <div className="card_block">
            {tierLists.map((item, idx)=>{
              return(
                <div className="card_item" key={idx}>
                  <div className={`card_header ${item.index <= tmpCurrentTier.index || item.isPass ? 'active' : 'default'}`}>
                    <div className="inblock left">Tier{item.index}</div>
                    <div className="inblock right">
                      <div>{getFilledNum(item, tmpCurrentTier)} Filled</div>
                      {item.index === tmpCurrentTier.index ? (
                        <div className="disline">{sumLine(item, nowUlpSupply)}</div>
                      ):(
                        <div className="disline"></div>
                      )}
                    </div>
                  </div>
                  <div className={`info_list ${item.index <= tmpCurrentTier.index ? 'lactive' : ''}`}>
                    <div>
                      <div className="left">ULP</div>
                      <div className="right">{getText(item.filled)}</div>
                    </div>
                    <div>
                      <div className="left">APR</div>
                      <div className="right">Reward rate (UNIP/ULP)</div>
                    </div>
                    <div>
                      <div className="left">{item.apr}</div>
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
            <h2>Your Super Rewards Details</h2>
            <div className="contribution">
              <h2>Contribution</h2>
              <div className={userOnMobileDevice ? 'table_wap' : 'table'}>
                <div className="wap1">Timestamp</div>
                <div className="wap2">Tier</div>
                <div className="wap3">{userOnMobileDevice ? "buyedUlp" : "buyedUlpAmount"}</div>
                <div className="wap4">Vested UNIP</div>
              </div>

              {superUlp.details.map((item, idx)=>{
                  return (
                    <div className={userOnMobileDevice ? 'table_wap' : 'table'} key={idx}>
                      <div className="wap1">{formatDate(item.timestamp, userOnMobileDevice)}</div>
                      <div className="wap2">{item.tier}</div>
                      <div className="wap3">{item.buyedUlpAmount}</div>
                      <div className="wap4">{item.vestedUNIPAmount}</div>
                    </div>
                  )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    </SEO>
  )
}
