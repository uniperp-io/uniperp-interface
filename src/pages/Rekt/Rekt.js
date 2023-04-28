import "./Rekt.css"
import { useWeb3React } from "@web3-react/core";
import { t } from "@lingui/macro";
import useSWR from "swr";
import distributorAbi from "abis/RektDistributor.json";
import { useChainId } from "lib/chains";
import { contractFetcher,callContract } from "lib/contracts";
import { formatAmount,formatNumber } from "lib/numbers";
import { helperToast } from "lib/helperToast";
import { getServerUrlNew } from "config/backend";
import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';
import { useHistory } from "react-router-dom";
import Footer from "components/Footer/Footer";
import { GMX_DECIMALS } from "lib/legacy";
import { ARBITRUM_TESTNET, ARBITRUM } from "config/chains";

export default function Rekt({connectWallet}) {
  const { active, account, library } = useWeb3React();
  const distributorMap = {
    [ARBITRUM]:"0xBd4E5EBAEBb5935b8F5F1ab1CAbec40f9E25980d",
    [ARBITRUM_TESTNET]:"0x8FD1c2417F373239845B09125F02a9BC053B8F31",
  };
  const { chainId } = useChainId();

  const [copyText, setCopyText] = useState("Invite Friends");
  const [countdown, setCountdown] = useState({d:0, h:0, m:0, s:0});

  const history = useHistory();
  const searchParams = new URLSearchParams(history.location.search);
  const refAddress = searchParams.get("ref");
  const totalAidrop = 16800000;
  const distributor = distributorMap[chainId]

  const { data: canClaimAmount } = useSWR(
    active && [active, chainId, distributor, "calcClaimableAmount"],
    {
      fetcher: contractFetcher(library, distributorAbi, {from:account}),
    }
  );

  const { data: totalClaimedAmount } = useSWR(
    active && [active, chainId, distributor, "totalClaimedAmount"],
    {
      fetcher: contractFetcher(library, distributorAbi),
    }
  );

  const { data: claimedUser } = useSWR(
    active && [active, chainId, distributor, "_claimedUser", account],
    {
      fetcher: contractFetcher(library, distributorAbi),
    }
  );

  const { data: endTime } = useSWR(
    active && [active, chainId, distributor, "endTime"],
    {
      fetcher: contractFetcher(library, distributorAbi),
    }
  );

  const getPercent = ()=>{
    let t = formatAmount(totalClaimedAmount, GMX_DECIMALS, false, false);
    const tmp = (t / totalAidrop)*100;
    if (tmp >= 100){
      return 100;
    }
    return tmp.toFixed(2)
  }

  const textBlock = () => {
    return (
      <>
        <p>Provide some liquidity for  <a href="https://app.uniperp.io/#/buy_ulp" target="_blank">Uniperp</a></p>
        <p>you can earn UNIP token One minute later</p>
        <p>you can claim UNIP here!</p>
      </>
    )
  }

  const getBtnText = ()=>{
    if (claimedUser){
      return "You have received"
    }

    if (active){
      return "Claim $UNIP"
    }

    if (!active){
      return t`Connect Wallet`;
    }
  }

  const clickClaim = async ()=>{
    if (!active){
      connectWallet()
      return;
    }

    if (chainId && account){
      const api = getServerUrlNew(chainId, `/airdrop_claimable?chain_id=${chainId}&account=${account}`)
      const data = await fetch(api).then((resp)=>resp.json())

      if (!data.isClaimable) {
        helperToast.error(data.msg)
        return
      }

      const contract = new ethers.Contract(distributor, distributorAbi.abi, library.getSigner());
      callContract(chainId, contract, "claim", [data.nonce, data.signature, (refAddress ? refAddress : ethers.constants.AddressZero)], {
          gasLimit: 200000,
          gasPrice: ethers.utils.parseUnits("0.4", "gwei"),
          sentMsg: t`claimTokens submitted!`,
          successMsg: `claimTokens success`,
          failMsg: t`claimTokens failed.`,
        })
        .then(async () => {

        }).finally(()=>{
      })
    }
  }

  const btnGroup = () => {
    const token = formatAmount(canClaimAmount, GMX_DECIMALS, false, true)
    return (
      <>
        <button className="fYSqLR" disabled={claimedUser} onClick={clickClaim}>
          {getBtnText()}
        </button>

        <button className="ORQPg" onClick={()=>{
              if (account){
                const textToCopy = `https://app.uniperp.io/#/airdrop?ref=${account}`;
                navigator.clipboard.writeText(textToCopy);
                helperToast.success("copy success!")
                setCopyText("Copied")
              }
            }}
          >
          {copyText}
        </button>
        <div>You can claim <span>{token}</span> UNIP token</div>
      </>
    )
  }

  function timeLeft(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = timestamp - now;
    const days = Math.floor(timeLeft / (60 * 60 * 24)).toString().padStart(2, '0');
    const hours = Math.floor((timeLeft % (60 * 60 * 24)) / (60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((timeLeft % (60 * 60)) / 60).toString().padStart(2, '0');
    const seconds = Math.floor(timeLeft % 60).toString().padStart(2, '0');
    return { d:days, h:hours, m:minutes, s:seconds };
  }

  const endAt = endTime;
  useEffect(()=>{
    const timer = setInterval(()=>{
      const tmp = timeLeft(endAt);
      if (tmp.m && tmp.s){
        setCountdown(tmp)
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [endAt, setCountdown])

  return (
    <>
      <div className="rekt_main">
        <div className="rekt_block">
          <h1>You can claim $UNIP now!</h1>
          <div className="rekt_text">{textBlock()}</div>

          {endTime && countdown.m && countdown.s ? (
            <div className="airdrop_date">
              <div className="item">
                <span>{countdown.d}</span>
                <div>DAYS</div>
              </div>
              <div className="item">
                <span>{countdown.h}</span>
                <div>HOURS</div>
              </div>
              <div className="item">
                <span>{countdown.m}</span>
                <div>MINUTES</div>
              </div>
              <div className="item">
                <span>{countdown.s}</span>
                <div>SECONDS</div>
              </div>
            </div>
          ):(<></>)}

          <div className="proccess">
            <div className="proccess_text">
              <div>Claim</div>
              <div>{formatNumber(totalAidrop)}</div>
            </div>
            <div className="proccess_item">
              <div className="proccess_iteming" style={{width:`${getPercent()}%`}}/>
            </div>
          </div>

          <div className="rekt_btn">{btnGroup()}</div>
        </div>
      </div>
      <Footer />
    </>
  )
}
