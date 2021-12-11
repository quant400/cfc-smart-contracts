const { expect } = require("chai")
const { ethers } = require("hardhat")

const MAX = ethers.constants.MaxUint256
const TEN_FIGHT = ethers.utils.parseEther('10')
const TEN_LP = TEN_FIGHT

describe("Staking Test", function () {
  it("Get Signers", async function() {
    [deployer, user1, user2] = await ethers.getSigners()
    recipients = [user1.address, user2.address]
  })

  it("Deploy Contracts", async function () {
    const FightToken = await ethers.getContractFactory("FightToken")
    const CFCStakingRewardsLP = await ethers.getContractFactory("CFCStakingRewardsLP")

    fight = await FightToken.deploy()
    await fight.deployed()

    // use fight token as equivalent erc20 contract for the lp
    lp = await FightToken.deploy()
    await lp.deployed()

    staking = await CFCStakingRewardsLP.deploy(
      fight.address,
      lp.address
    )
    await staking.deployed()
  })

  it("Stake and EmergencyUnstake", async function() {
    await lp.approve(staking.address, MAX)
    expect(await lp.allowance(deployer.address, staking.address)).to.equal(MAX)

    const VERYLONGTIME = 100000000000 // in seconds
    // stake and unstake without rewards
    await staking.stake(1, TEN_LP, VERYLONGTIME)
    await staking.emergencyUnstake(1, 0, deployer.address)

    MIN_STAKE_DURATION = await staking.MIN_STAKE_DURATION()
    // stake more for later test
    await staking.stake(1, TEN_LP, VERYLONGTIME)
    await staking.stake(1, TEN_LP, VERYLONGTIME)

    // in case for the last test
    await staking.stake(1, TEN_LP, MIN_STAKE_DURATION)
    await staking.stake(1, TEN_LP, MIN_STAKE_DURATION)
  })

  it("Admin Push Reward", async function () {
    await fight.transfer(staking.address, TEN_FIGHT)
    expect(await fight.balanceOf(staking.address)).to.equal(TEN_FIGHT)

    // reward duration in seconds
    await staking.notifyRewardAmount(TEN_FIGHT, 1)
    periodFinish = await staking.periodFinish()
    console.log('periodFinish', periodFinish.toString())

    // there is no way to do exact check, need to manually see the output
    // and make judgement call if it makes sense
    async function stakignStatsCheck () {
      const rewardPerToken = await staking.rewardPerShare()
      const rewardRate = await staking.rewardRate()
      const lastTimeRewardApplicable = await staking.lastTimeRewardApplicable()
      const lastUpdateTime = await staking.lastUpdateTime()
      console.log('rewardPerToken', rewardPerToken.toString())
      console.log('rewardRate', rewardRate.toString())
      console.log('lastTimeRewardApplicable', lastTimeRewardApplicable.toString())
      console.log('lastUpdateTime', lastUpdateTime.toString())

      const earned1 = await staking.earned(1, 0)
      const earned2 = await staking.earned(1, 1)
      console.log('earned1', earned1.toString())
      console.log('earned2', earned2.toString())
      expect(earned1).to.equal(earned2)
    }

    await stakignStatsCheck();
    blocktime = await ethers.provider.getBlock();
    console.log('timestamp now', blocktime.timestamp)
    // block only mine when there is a tx, so we do this to manually update
    await fight.transfer(deployer.address, TEN_FIGHT)
    blocktime = await ethers.provider.getBlock()
    console.log('timestap now', blocktime.timestamp)

    await stakignStatsCheck()
  });

  it("Unstake TimeLock", async function() {
    await expect(staking.unstake(1, 0, user1.address)).to.be.revertedWith('Still in lock')
    await expect(staking.unstakeWithoutReward(1, 0, user1.address)).to.be.revertedWith('Still in lock')
  })


  // we can not run this test for 1 day, so if MIN_STAKE_DURATION is 1 day
  // it is not possible to test it from the script
  // therefore only uncomment the following if you change min_stake_duration
  // in the contract to 1 second
  // it("Stake and Unstake With Reward", async function() {
  //   const before = await lp.balanceOf(user1.address)
  //   await staking.unstake(1, 2, user1.address)
  //   const after = await lp.balanceOf(user1.address)
  //   const targetBalance = "1666666666666666660"
  //
  //   expect(await fight.balanceOf(user1.address)).to.equal(targetBalance)
  //   expect((after - before).toString()).to.equal(TEN_LP.toString())
  //   await staking.unstakeWithoutReward(1, 2, user1.address)
  //   expect(await fight.balanceOf(user1.address)).to.equal(targetBalance)
  // })
});
