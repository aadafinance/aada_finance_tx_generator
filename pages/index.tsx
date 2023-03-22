import Link from "next/link"

import styles from "../styles/index.module.css"

const Index = () => (
  <div className={styles.container}>
    <h1 className={styles.title}>Aada off-chain transaction generator</h1>

    <div>
      <ul className={styles.list}>
        <li>
        <Link href="/cancelrequest">Cancel Liquidity request</Link>
        </li>
        <li>
          <Link href="/cancelrequestdebt">Cancel Liquidity deposit</Link>
        </li>
        <li>
          <Link href="/paybackloan">Repay Loan</Link>
        </li>
        <li>
          <Link href="/liquidateexpired">Liquidate loan (Expired)</Link>
        </li>
        <li>
          <Link href="/withdrawinterest">Withdraw repaid interest</Link>
        </li>
        <li>
          <Link href="/withdrawcollateral">Withdraw liquidated collateral</Link>
        </li>
      </ul>
    </div>
  </div>
)

export default Index
