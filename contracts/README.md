# Explanations

### Following are Solidity 0.6.2

For Staking Contracts, StakingLP.sol is the base, StakingFight.sol is only slightly revised based on StakingLP.sol, because StakingFight.sol use wrappedFight as stakingToken so when stake and unstake, it has an additional process of wrap/unwrap.

FighterNFT use OpenZeppelin ERC721 as a core and hook it in with 2 staking contracts above.

FighterNFT is the access to staking features, user need to have an NFT and then stake to the NFT. 

### Following are Solidity 0.8.0

FightToken is based on the OpenZeppelin ERC20 contract with an add-on of 10 millions FIGHT token inflation per year.

CutOffMultiRecipients.sol is the vesting contract based on OpenZeppelin TimeLock contract, however we extend it so that it has multiple releases and accept multiple recipients.

WrappedFight.sol is to a play role in StakingFight.sol so that we can isolate the principle token with reward token. Because on the outside when users stake fight, they stake FIGHT token and also rewarded FIGHT token.

CFC Tech Team
