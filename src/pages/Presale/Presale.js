import logoImg from "img/logo_GMX.svg";
import React from "react";
import "./Presale.css"

export default function Presale(){
  return(
    <div>
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
          <span>$1,200,000.00</span>
          <span> / </span>
          <span>$1,200,000</span>
        </div>
      </div>

      <div className="button_group">
        <div className="card claim left">
          <h3>CLAIM UNIP</h3>
          <div>Deposited($): <span>0.00</span></div>
          <div>UNIP Amount: <span>0</span></div>
          <button className="App-cta Exchange-swap-button">WithDraw UNIP</button>
        </div>

        <div className="card deposited_usdc right">
          <h3>Invest USDC</h3>
          <div>Your balance: <span>0.00</span></div>
          <div>Deposited: <span>0</span></div>
          <button className="primary-btn">Deposited USDC</button>
        </div>
      </div>

      <div className="card information">
        <h1>General Information</h1>
        <ul>
          <li>$1 USDC = 625 UNIP ($0.0016/token)</li>
          <li>WHEN CLAIM BUTTON OPENS, you will claim your equivalent of new UNIP</li>
          <li>5% released every after week</li>
          <li>Token Economics</li>
        </ul>
      </div>

    </div>
  )
}
