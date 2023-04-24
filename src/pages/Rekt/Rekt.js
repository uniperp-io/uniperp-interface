import "./Rekt.css"
import { useWeb3React } from "@web3-react/core";
import { t } from "@lingui/macro";
import useSWR from "swr";
import Abi from "abis/RektDistributor.json";
import { useChainId } from "lib/chains";
import { contractFetcher,callContract } from "lib/contracts";
import { formatAmount } from "lib/numbers";
import { helperToast } from "lib/helperToast";
import { getServerUrlNew } from "../../config/backend";
import { useEffect, useState } from "react";
import { ethers } from 'ethers';
import { useHistory } from "react-router-dom";

export default function Rekt({connectWallet}) {
  const { active, account, library } = useWeb3React();
  const distributor = "0x78FA2EC29A3C781E434CfE6AE3c5d14C7aad7a62";
  const { chainId } = useChainId();
  const [count, setCount] = useState(null);

  const history = useHistory();
  const searchParams = new URLSearchParams(history.location.search);
  const refAddress = searchParams.get("ref");

  useEffect(() => {
    async function fetchTransactionCount() {
      if (!library || !account) return;
      const provider = new ethers.providers.Web3Provider(library.provider);
      const count = await provider.getTransactionCount(account);
      setCount(count);
    }
    fetchTransactionCount();
  }, [library, account]);

  const { data: canClaimAmount } = useSWR(
    active && [active, chainId, distributor, "canClaimAmount"],
    {
      fetcher: contractFetcher(library, Abi),
    }
  );

  const textBlock = () => {
    return (
      <>
        <p>Provide some liquidity for  <a href="https://app.uniperp.io/#/buy_ulp" target="_blank">Uniperp</a></p>
        <p>you can earn UNIP token and REKT token. One minute later</p>
        <p>you can claim REKT here!</p>
      </>
    )
  }

  const getBtnText = ()=>{
    if (active){
      return "Claim $REKT"
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
      const api = getServerUrlNew(chainId, `/rekt_claimable?chain_id=${chainId}&account=${account}&nonce=${count}`)
      const data = await fetch(api).then((resp)=>resp.json())

      if (!data.isClaimable) {
        helperToast.error(data.msg)
        return
      }

      const contract = new ethers.Contract(distributor, Abi.abi, library.getSigner());
      callContract(chainId, contract, "claim", [count, data.signature, (refAddress ? refAddress : account)], {
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
    const token = formatAmount(canClaimAmount, 6, false, true)
    return (
      <>
        <button className="fYSqLR" onClick={clickClaim}>{getBtnText()}</button>
        <button className="ORQPg" onClick={()=>{
          if (account){
            const textToCopy = `https://app.uniperp.io/#/rekt?ref=${account}`;
            navigator.clipboard.writeText(textToCopy);
            helperToast.success("copy success!")
          }
        }}>Invite Friends</button>
        <div>You can claim <span>{token}</span> REKT token</div>
      </>
    )
  }

  return (<div className="rekt_main">
    <div className="rekt_block rekt_showpc">
      <div className="rekt_text">{textBlock()}</div>
      <div className="rekt_btn">{btnGroup()}</div>
    </div>

    <div className="jGKbQD rekt_showwap">
      <div className="rekt_block">
        <div className="rekt_text">{textBlock()}</div>
        <div className="rekt_btn">{btnGroup()}</div>
      </div>
    </div>
  </div>)
}
