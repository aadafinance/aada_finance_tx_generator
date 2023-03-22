import { isNil } from "lodash"
import { Blockfrost, Lucid } from "lucid-cardano"
import { useCallback, useEffect, useState } from "react"

import { useNetworkId } from "./use-network-id"
import { useWalletApi } from "./use-wallet-api"

const useLucid = () => {
  const [lucid, setLucid] = useState<Lucid>()
  const walletApi = useWalletApi()
  const networkId = useNetworkId(walletApi)

  const initializeLucid = useCallback(async () => {
    console.log("Network id is", networkId);
    if (isNil(networkId) || isNil(walletApi)) return
    const network = networkId === 0 ? "Preprod" : "Mainnet"

    const provider = new Blockfrost("https://cardano-mainnet.blockfrost.io/api/v0",
        "mainnet1RTeXo584jV7g85wBNrEqCocde3RBWIv");
    const updatedLucid = await (isNil(lucid)
      ? Lucid.new( provider,
            "Mainnet",)
      : lucid.switchProvider(provider,
            "Mainnet",))

    const lucidWithWallet = updatedLucid.selectWallet(walletApi)

    setLucid(lucidWithWallet)
  }, [lucid, networkId, walletApi])

  useEffect(() => {
    initializeLucid()
  }, [initializeLucid])

  return {
    networkId,
    walletApi,
    lucid,
  }
}

export { useLucid }
