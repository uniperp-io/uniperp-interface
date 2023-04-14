import "./Hyper.css"
import SEO from "components/Common/SEO";
import { getPageTitle} from "lib/legacy";
import { useWeb3React } from "@web3-react/core";

export default function Hyper() {
  const {chainId, library, active, account} = useWeb3React()

  const tierLists = [
    {"num":1},
    {"num":2},
    {"num":3},
    {"num":4},
    {"num":5},
    {"num":6},
  ];

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
            {tierLists.map(item=>{
              return(
                <div className="card_item">
                  <div className="card_header active">
                    <div className="inblock left">Tier{item.num}</div>
                    <div className="inblock right">
                      <div>500.0K Filled</div>
                      <div className="line"></div>
                    </div>
                  </div>
                  <div className="info_list lactive">
                    <div>
                      <div className="left">ULP</div>
                      <div className="right">First 500.0K</div>
                    </div>
                    <div>
                      <div className="left">ARP</div>
                      <div className="right">Reward rate (UNIP/ULP)</div>
                    </div>
                    <div>
                      <div className="left">220.2%</div>
                      <div className="right">0.500</div>
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
