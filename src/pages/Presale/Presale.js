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

export default function Presale(){
  const [isWaitingForApproval, setIsWaitingForApproval] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isWithdrawAble, setWithdrawAble] = useState(true)
  const [isDepositedAble, setDepositedAble] = useState(false)
  const [isApproving, setIsApproving] = useState(false);
  const [inputAmount, setInputAmount] = useState(100);
  const [IsConfirming, setIsConfirming] = useState(false);
  const [TotalContributed, setTotalContributed] = useState(false);

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

  const { data: totalContributed } = useSWR(
    active && [active, chainId, idoAddress, "totalContributed"],
    {
      fetcher: contractFetcher(library, IdoAbi),
    }
  );

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
        successMsg: `ido ${inputAmount} for 10000UNIP`,
        failMsg: t`Swap failed.`,
      })
      .then(async () => {

      }).finally(()=>{
        setDepositedAble(false)
        setIsConfirming(false);
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
        <h1>IDO Start at: 2023-04-01 20:00:00</h1>
        <div className="countdown">
          <span>{`10D`}</span>
          <span>{`10H`}</span>
          <span>{`10M`}</span>
          <span>{`10S`}</span>
        </div>
      </div>

      <div className="button_group">
        <div className="card claim left">
          <h3>CLAIM UNIP</h3>
          <div>Deposited($): <span>${formatAmount(contributions, usdcTokenInfo.decimals, 2)}</span></div>
          <div>UNIP Amount: <span>{formatAmount(claimableTokens, usdcTokenInfo.decimals, 2)}</span></div>
          <button className="App-cta Exchange-swap-button" disabled={isWithdrawAble}>WithDraw UNIP</button>
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
          <li>$1 USDC = 10 UNIP ($0.0016/token)</li>
          <li>WHEN CLAIM BUTTON OPENS, you will claim your equivalent of new UNIP</li>
          <li>5% released every after week</li>
          <li>Token Economics</li>
        </ul>
      </div>
    </div>
  )
}
