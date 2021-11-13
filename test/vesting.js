const { expect } = require("chai");
const { ethers } = require("hardhat");

const now = Math.round(Date.now() / 1000) // to seconds rather than miliseconds
const divisionFactor = 1000;
const scheduleTime = [now + 2, now + 6, now + 10]
console.log('Scheduled Time', scheduleTime)
const scheduleAmounts = [1000000, 2000000, 5000000]
const total = scheduleAmounts.reduce((a, b) => a + b, 0)
const percents = [400, 600]

describe("CutOff Multi-Recipients Vesting Test", function () {
  it("Get Signers", async function() {
    [deployer, user1, user2] = await ethers.getSigners()
    recipients = [user1.address, user2.address]
  })

  it("Deploy Contracts", async function () {
    const FightToken = await ethers.getContractFactory("FightToken")
    const TokenVesting = await ethers.getContractFactory("FightTokenVesting")

    fight = await FightToken.deploy()
    await fight.deployed()

    vesting = await TokenVesting.deploy(
      fight.address,
      scheduleTime,
      scheduleAmounts,
      recipients,
      percents
    )
    await vesting.deployed()
  })

  it("Test Basic Params", async function() {
    expect(await vesting.fight()).to.equal(fight.address)
    expect(await vesting.divisionFactor()).to.equal(divisionFactor)
    expect(await vesting.totalReleases()).to.equal(scheduleTime.length)
    for (let i = 0; i < scheduleTime.length; i++) {
      const release = await vesting.releasePoints(i)
      expect(release.time).to.equal(scheduleTime[i])
      expect(release.amount).to.equal(scheduleAmounts[i])
      expect(release.hasReleased).to.equal(false)
    }

    for (let i = 0; i < percents.length; i++) {
      const recipient = await vesting.recipients(i)
      expect(recipient.recipient).to.equal(recipients[i])
      expect(recipient.percent).to.equal(percents[i])
    }
  })

  it("Transfer Fight to Vesting", async function() {
    await fight.transfer(vesting.address, total);
    expect(await fight.balanceOf(vesting.address)).to.equal(total);
  })

  it("Trigger Vesting", async function() {
    await vesting.release(0)
    const balance1 = parseInt(scheduleAmounts[0] * percents[0] / divisionFactor)
    const balance2 = parseInt(scheduleAmounts[0] * percents[1] / divisionFactor)
    expect(await fight.balanceOf(user1.address)).to.equal(balance1)
    expect(await fight.balanceOf(user2.address)).to.equal(balance2)
    await expect(vesting.release(0)).to.be.revertedWith('Batch already released');
    console.log('current blocktime', (await ethers.provider.getBlock()).timestamp)
    await expect(vesting.release(2)).to.be.revertedWith('Current time is before release time');

    console.log('current blocktime', (await ethers.provider.getBlock()).timestamp)

    await expect(vesting.release(3)).to.be.revertedWith('No such a releases');
    console.log('current blocktime', (await ethers.provider.getBlock()).timestamp)

    await vesting.release(1)
    console.log('current blocktime', (await ethers.provider.getBlock()).timestamp)
    expect(await fight.balanceOf(user1.address)).to.equal(
      balance1 + parseInt(scheduleAmounts[1] * percents[0] / divisionFactor)
    )
    expect(await fight.balanceOf(user2.address)).to.equal(
      balance2 + parseInt(scheduleAmounts[1] * percents[1] / divisionFactor)
    )
  })

});
