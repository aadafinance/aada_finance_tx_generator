import { useHasNamiExtension } from "hooks/use-has-nami-extension"
import { useLucid } from "hooks/use-lucid"
import { useTransactionSender } from "hooks/use-transaction"

import styles from "../styles/index.module.css"

const Index = () => {
  const hasNamiExtension = useHasNamiExtension()
  const { lucid, networkId } = useLucid()
  const tx = useTransactionSender(lucid)

  // strict equals to avoid undefined
  if (hasNamiExtension === false)
    return <div>This example only works with the Nami extension installed. Please install it.</div>

  // not initialized yet
  if (!lucid) return null

  // const canTransact = tx.lovelace > 0 && tx.toAccount
    const canTransact = true;
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Cancel Liquidity deposit</h1>
      {networkId === 1 && (
        <>
          <br />
          <div>
            <b className={styles.warning}>
             ⚠️ Make sure to review the tranasction you are about to sign! ⚠️
            </b>
          </div>
        </>
      )}
      <br />


        <div>
            <label>
                <span className={styles.label}>Lender token name</span>

                <input
                    className={styles.input}
                    type="text"
                    value={tx.tokenName}
                    onChange={(e) => tx.setTokenName(e.target.value?.toString())}
                />
            </label>
        </div>


      <div>
        <button disabled={!canTransact} className={styles.button} onClick={tx.cancelLiquidityDeposit}>
          Send transaction
        </button>
        <label>
          <br></br>
          <br></br>
        <span className={styles.label}>Wait few seconds after the click</span>
        </label>
        {!tx.successMessage && !tx.error && !canTransact && (
          <p className={styles.info}>
            <small>Please enter a valid value</small>
          </p>
        )}

        {tx.error && (
          <p className={styles.info}>
            <small>{tx.error.message}</small>
          </p>
        )}

        {tx.successMessage && (
          <p className={styles.info}>
            <small>{tx.successMessage}</small>
          </p>
        )}
      </div>
    </div>
  )
}

export default Index
