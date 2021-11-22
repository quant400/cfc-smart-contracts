const { expect } = require("chai");
const { ethers } = require("hardhat");

const MAX = ethers.constants.MaxUint256;
const TEN_FIGHT = ethers.utils.parseEther('10');

describe("Staking Test", function () {
  it("Get Signers", async function() {
    [deployer, user1, user2] = await ethers.getSigners()
    recipients = [user1.address, user2.address]
  })

  it("Deploy Contracts", async function () {
    const FightToken = await ethers.getContractFactory("FightToken")
    const CFCStakingRewards = await ethers.getContractFactory("CFCStakingRewards")

    fight = await FightToken.deploy()
    await fight.deployed()

    // use fight token as equivalent erc20 contract for the lp
    lp = await FightToken.deploy()
    await lp.deployed()

    staking = await CFCStakingRewards.deploy(
      fight.address,
      lp.address
    )
    await staking.deployed()
  })

  it("Stake and Unstake Basic Without Reward", async function() {
    await lp.approve(staking.address, MAX)
    expect(await lp.allowance(deployer.address, staking.address)).to.equal(MAX)

    // stake and unstake without rewards
    await staking.stake(1, TEN_FIGHT, 0)
    await staking.stake(1, TEN_FIGHT, 0)
    await staking.unstake(1, 0, deployer.address)
    await staking.unstakeWithoutReward(1, 0, deployer.address)

    // stake more for later test
    await staking.stake(1, TEN_FIGHT, 0)
    await staking.stake(1, TEN_FIGHT, 0)
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

  it("Stake and Unstake With Reward", async function() {
    const before = await lp.balanceOf(user1.address)
    await staking.unstake(1, 0, user1.address)
    const after = await lp.balanceOf(user1.address)
    const five = ethers.utils.parseEther('5')

    expect(await fight.balanceOf(user1.address)).to.equal(five)
    expect((after - before).toString()).to.equal(TEN_FIGHT.toString())
    await staking.unstakeWithoutReward(1, 0, user1.address)
    expect(await fight.balanceOf(user1.address)).to.equal(five)
  })
});
