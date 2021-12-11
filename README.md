# Crypto Fight Club Smart Contracts

Fight Token has a 10 millions (1% of the initial supply) inflation rate per year without compounding.

For vesting contract, we will use the cut-off multi-recipients vesting contract in production.

### Test

Please run tests separately as our smart contracts are time-dependent

```
npx hardhat test test/vesting.js
```

and

```
npx hardhat test test/staking.js
```

CFC Tech Team
