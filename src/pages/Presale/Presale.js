import logoImg from "img/logo_long.png";
import React, { useEffect, useState } from "react";
import "./Presale.css"
import Modal from "components/Modal/Modal";
import { t } from "@lingui/macro";
import { useWeb3React } from "@web3-react/core";
import {isSupportedChain} from "config/chains";
import { useChainId } from "lib/chains";
import useSWR from "swr";
import { getUsdcToken } from "lib/legacy";
import { getContract } from "config/contracts";
import { contractFetcher, callContract } from "lib/contracts";
import Token from "abis/Token.json";
import IdoAbi from "abis/ido.json";
import { approveTokens } from "domain/tokens";
import { formatAmount, parseValue } from "lib/numbers";
import { ethers } from "ethers";
import {makeDateText, getRemainingTime} from "pages/Presale/lib"

const initCountdown = "<span>0D</span><span>0H</span><span>0M</span><span>0S</span>";

export default function Presale() {
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isWithdrawAble, setWithdrawAble] = useState(true)
  const [isDepositedAble, setDepositedAble] = useState(false)
  const [isApproving, setIsApproving] = useState(false);
  const [inputAmount, setInputAmount] = useState(100);
  const [IsConfirming, setIsConfirming] = useState(false);
  const [countdown, setCountdown] = useState(initCountdown);

  const { active, account, library } = useWeb3React();

  const { chainId } = useChainId();
  const usdcTokenInfo = getUsdcToken(chainId);
  const idoAddress = getContract(chainId, "Ido");

  const { data: tokenAllowance } = useSWR(
    active && [active, chainId, usdcTokenInfo.address, "allowance", account, idoAddress],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  const { data: balanceOf } = useSWR(
    active && [active, chainId, usdcTokenInfo.address, "balanceOf", account],
    {
      fetcher: contractFetcher(library, Token),
    }
  );

  const { data } = useSWR("idoinfo", {
      fetcher: () => {
          return Promise.all(["totalContributed", "startTime", "endTime", "rate"].map((method) =>
              contractFetcher(library, IdoAbi)(
                method,
                chainId,
                idoAddress,
                method
              )
          )
        ).then((responses) => {
            return responses
        })
      }
  });

  let totalContributed = parseValue(0), startTime = 0, endTime = 0, rate = 0;
  if (data){
    totalContributed = data[0]
    startTime = data[1].toString()
    endTime = data[2].toString()
    rate = parseInt(data[3].toString())
  }

  const { data: claimableTokens } = useSWR(
    active && [active, chainId, idoAddress, "claimableTokens", account],
    {
      fetcher: contractFetcher(library, IdoAbi),
    }
  );

  const { data: contributions } = useSWR(
    active && [active, chainId, idoAddress, "contributions", account],
    {
      fetcher: contractFetcher(library, IdoAbi),
    }
  );

  const usdcBalance = formatAmount(balanceOf, usdcTokenInfo.decimals, 4);

  const needApproval = tokenAllowance && (tokenAllowance.toString() === "0" || tokenAllowance.toString() === "0.00");
  useEffect(()=>{
    if (!needApproval){
      setDepositedAble(false)
    }
  }, [needApproval])

  let status = "unstart";
  const now = Date.now() / 1000; // 将当前时间转换为秒
  if (now > startTime){
    status = "starting"
  }
  if (endTime && (now > endTime)){
    status = "end"
  }

  useEffect(()=>{
    let timer;
    timer = setInterval(()=>{
      let remainingTime;
      if(status === "unstart") {
        remainingTime = getRemainingTime(startTime);
        if (!needApproval){
          setDepositedAble(true)
        }
        if (remainingTime){
          setCountdown(`<span>${remainingTime.days}D</span><span>${remainingTime.hours}H</span><span>${remainingTime.minutes}M</span><span>${remainingTime.seconds}S</span>`);
          if (startTime && (remainingTime.seconds === 0 && remainingTime.hours === 0 && remainingTime.minutes === 0)){
            window.location.reload()
            clearInterval(timer)
          }
        }
      }

      if(status === "starting") {
        remainingTime = getRemainingTime(endTime);
        setDepositedAble(false)
        if (remainingTime){
          setCountdown(`<span>${remainingTime.days}D</span><span>${remainingTime.hours}H</span><span>${remainingTime.minutes}M</span><span>${remainingTime.seconds}S</span>`);
          if (endTime && (remainingTime.seconds === 0 && remainingTime.hours === 0 && remainingTime.minutes === 0)){
            window.location.reload()
            clearInterval(timer)
          }
        }
      }

      if (status === "end"){
        setDepositedAble(true)
        setWithdrawAble(false)
      }

    }, 1000)
    return () => {
      clearInterval(timer);
    };
  }, [startTime, endTime, needApproval, status])

  const getPrimaryText = () => {
    if (!active) {
      return t`Connect Wallet`;
    }
    if (!isSupportedChain(chainId)) {
      return t`Incorrect Network`;
    }

    if (needApproval && isWaitingForApproval) {
      return t`Waiting for Approval`;
    }
    if (isApproving) {
      return t`Approving ${usdcTokenInfo.symbol}...`;
    }
    if (needApproval) {
      return t`Approve ${usdcTokenInfo.symbol}`;
    }
    if(IsConfirming){
      return t`Confirming...`
    }
    return  t`Deposited USDC`;
  };

  const depositedUSDCClick = () => {
    if(needApproval){
      approveTokens({
        setIsApproving,
        library,
        tokenAddress: usdcTokenInfo.address,
        spender: idoAddress,
        chainId: chainId,
        onApproveSubmitted: () => {
          setIsWaitingForApproval(true);
        },
      });
    }else{
      setIsModalVisible(true)
    }
  }

  const clickMaxInput = () => {
    setInputAmount(usdcBalance)
  }

  const clickConfirm = () => {
    setDepositedAble(true)
    setIsConfirming(true)
    const contract = new ethers.Contract(idoAddress, IdoAbi.abi, library.getSigner());
    callContract(chainId, contract, "buyTokens", [parseValue(inputAmount, usdcTokenInfo.decimals)], {
        sentMsg: t`buyTokens submitted!`,
        successMsg: `ido ${inputAmount} for ${inputAmount*rate}UNIP`,
        failMsg: t`buyTokens failed.`,
      })
      .then(async () => {

      }).finally(()=>{
        setDepositedAble(false)
        setIsConfirming(false);
      })
  }

  const claimToken = () => {
    setWithdrawAble(true)
    const contract = new ethers.Contract(idoAddress, IdoAbi.abi, library.getSigner());
    callContract(chainId, contract, "claimTokens", {
        sentMsg: t`claimTokens submitted!`,
        successMsg: `claimTokens success`,
        failMsg: t`claimTokens failed.`,
      })
      .then(async () => {

      }).finally(()=>{
      setWithdrawAble(false)
    })
  }

  return(
    <div className="presale">
      <Modal disableBodyScrollLock={true} isVisible={isModalVisible} setIsVisible={setIsModalVisible} label="Presale">
        <div className="big_input">
          <div>
            <div className="left">Buy</div>
            <div className="right">Balance: <span>{usdcBalance}</span></div>
          </div>
          <div className="input">
            <input type="number" value={inputAmount} onChange={(e)=>setInputAmount(e.target.value)} />
            <button className="primary-btn" onClick={clickMaxInput}>MAX</button>
            <span>USDC</span>
          </div>
        </div>
        <div className="btn_group">
          <button className="primary-btn" onClick={()=>setIsModalVisible(false)}>Cancel</button>
          <button className="App-cta Exchange-swap-button" disabled={isDepositedAble} onClick={clickConfirm}>{t`Confirm`}{IsConfirming ? '...' : ''}</button>
        </div>
      </Modal>

      <div className="card">
        <img className="logo" src={logoImg} alt="UNIP Logo" />
        <h1>
          <span>Participate in </span>
          <span>UNIP </span>
          <span>pre-IDO sale</span>
        </h1>
      </div>

      <div className="card ido_process">
        <div className="coininfo">
          <span>${formatAmount(totalContributed, usdcTokenInfo.decimals, 2)}</span>
          <span> / </span>
          <span>$1,200,000</span>
        </div>
      </div>

      <div className="card ido_process">
        {status === "unstart" && (
          <>
            <h1>IDO Start at: {makeDateText(startTime)}</h1>
            <div className="countdown" dangerouslySetInnerHTML={{ __html: countdown }}></div>
          </>
        )}
        {status === "starting" && (
          <>
            <h1>IDO End at: {makeDateText(endTime)}</h1>
            <div className="countdown" dangerouslySetInnerHTML={{ __html: countdown }}></div>
          </>
        )}
      </div>

      <div className="button_group">
        <div className="card claim left">
          <h3>CLAIM UNIP</h3>
          <div>Deposited($): <span>${formatAmount(contributions, usdcTokenInfo.decimals, 2)}</span></div>
          <div>UNIP Amount: <span>{formatAmount(claimableTokens, 18, 2)}</span></div>
          <button className="App-cta Exchange-swap-button" onClick={claimToken} disabled={isWithdrawAble}>WithDraw UNIP</button>
        </div>

        <div className="card deposited_usdc right">
          <h3>Invest USDC</h3>
          <div>Your balance: <span>{usdcBalance}</span></div>
          <div>Deposited: <span>{formatAmount(contributions, usdcTokenInfo.decimals, 2)}</span></div>
          <button className="App-cta Exchange-swap-button" disabled={isDepositedAble} onClick={depositedUSDCClick}>{getPrimaryText()}</button>
        </div>
      </div>

      <div className="card information">
        <h1>General Information</h1>
        <ul>
          <li>$1 USDC = {rate} UNIP ($0.01/token)</li>
          <li>Each person can only buy a maximum of $1000 USDC</li>
          <li>WHEN CLAIM BUTTON OPENS, you will claim your equivalent of new UNIP</li>
          <li>5% released every after week</li>
          <li>Token Economics</li>
        </ul>
      </div>
    </div>
  )
}
