
export const getCurrentTierinfo = function(chainId, library, active) {
  return {
    tier_num:1,
    ulp_filled:500000,
    ulp_filled_text:"500.0K",
    apr:"220.2%",
    rate:"0.500"
  }
}

export const getHyperinfo = function(chainId, library, active, account) {
  return {
    apr:"220.2%",
    ulp_amount:1000.56,
    usdc_statked:1000.56
  }
}
