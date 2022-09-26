const { assert, expect } = require("chai")
const { deployments, ethers, network } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Duel", async function () {
          const chainId = network.config.chainId
          let deployer,
              bettor,
              vault,
              duel,
              mockUSDC,
              vrfCoordinatorV2Mock,
              entranceFee
          beforeEach(async function () {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              bettor = accounts[1]
              vault = accounts[2]
              // deploy contracts
              await deployments.fixture(["all"])
              duel = await ethers.getContract("Duel", deployer.address)
              mockUSDC = await ethers.getContract("MockUSDC", deployer.address)
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer.address
              )
              entranceFee = await duel.getEntranceFee()
              await mockUSDC.approve(duel.address, entranceFee.mul(10))
              const mockUSDCConnectedContract = mockUSDC.connect(bettor)
              await mockUSDCConnectedContract.approve(
                  duel.address,
                  entranceFee.mul(10)
              )
          })
          describe("constructor", function () {
              it("should initialize state variables", async function () {
                  it("should set state variables in the constructor", async function () {
                      const coordinatorAddress =
                          await duel.getCoordinatorAddress()
                      const subscriptionId = await duel.getSubscriptionId()
                      const keyHash = await duel.getKeyHash()
                      const vaultAddress = await duel.getVaultAddress()
                      const rake = await duel.getRake()
                      assert.equal(
                          coordinatorAddress,
                          vrfCoordinatorV2Mock.address
                      )
                      assert.equal(
                          subscriptionId.toString(),
                          network.config.subscriptionId.toString()
                      )
                      assert.equal(
                          keyHash,
                          networkConfig[chainId]["vrfKeyHash"]
                      )
                      assert.equal(vaultAddress, vault.address)
                      assert.equal(rake.toString(), "0")
                  })
              })
          })
          describe("bet", function () {
              it("should allow user to enter", async function () {
                  await duel.enter()
                  const contractBalance = await mockUSDC.balanceOf(duel.address)
                  const entrant = await duel.entrants(0)
                  assert.equal(
                      contractBalance.toString(),
                      entranceFee.toString()
                  )
                  assert.equal(entrant, deployer.address)
              })
              it("should revert if user has insufficient funds", async function () {
                  const balance = await mockUSDC.balanceOf(deployer.address)
                  await mockUSDC.transfer(bettor.address, balance)
                  await expect(duel.enter()).to.be.revertedWithCustomError(
                      duel,
                      "Duel__InsufficientFunds"
                  )
              })
              it("should emit event", async function () {
                  await expect(duel.enter())
                      .to.emit(duel, "Entered")
                      .withArgs(8, deployer.address)
              })
              it("should handle high volume of entrants", async function () {
                  const accounts = await ethers.getSigners()

                  // send usd
                  for (let i = 0; i < 10; i++) {
                      await mockUSDC.transfer(accounts[i].address, entranceFee)
                      await mockUSDC
                          .connect(accounts[i])
                          .approve(duel.address, entranceFee)
                  }

                  // enter
                  for (let i = 0; i < 9; i++) {
                      duel.connect(accounts[i]).enter()
                  }
                  const txResponse = await duel.connect(accounts[9]).enter()
                  await txResponse.wait()

                  assert.equal(
                      (await mockUSDC.balanceOf(duel.address)).toString(),
                      (entranceFee * 10).toString()
                  )

                  // settle
                  for (let i = 0; i < 5; i++) {
                      await new Promise(async (resolve, reject) => {
                          duel.once("RoundSettled", async () => {
                              resolve()
                          })
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              i + 1, // requestId
                              duel.address
                          )
                      })
                  }

                  // assert
                  assert(
                      ["50000000", "60000000"].includes(
                          (
                              await mockUSDC.balanceOf(accounts[0].address)
                          ).toString()
                      )
                  )
                  for (let i = 1; i < 10; i++) {
                      assert(
                          ["0", "10000000"].includes(
                              (
                                  await mockUSDC.balanceOf(accounts[i].address)
                              ).toString()
                          )
                      )
                  }
              })
          })
          describe("settle round", function () {
              it("should settle automatically when second user enters", async function () {
                  await duel.enter()
                  await new Promise(async (resolve, reject) => {
                      duel.once(
                          "RoundSettled",
                          async (blockNumber, potAmount, winner) => {
                              try {
                                  // assert
                                  const deployerEndBalance =
                                      await mockUSDC.balanceOf(deployer.address)
                                  const bettorEndBalance =
                                      await mockUSDC.balanceOf(bettor.address)
                                  assert(
                                      deployerEndBalance.toString() ==
                                          deployerStartBalance.add(
                                              entranceFee * 2
                                          ) ||
                                          deployerEndBalance.toString() ==
                                              deployerStartBalance.toString()
                                  )
                                  assert(
                                      bettorEndBalance.toString() ==
                                          bettorStartBalance.add(
                                              entranceFee * 2
                                          ) ||
                                          bettorEndBalance.toString() ==
                                              bettorStartBalance.toString()
                                  )
                                  assert.equal(blockNumber.toString(), "11")
                                  assert.equal(
                                      potAmount.toString(),
                                      (entranceFee * 2).toString()
                                  )
                                  assert(
                                      winner == deployer.address ||
                                          winner == bettor.address
                                  )
                              } catch (error) {
                                  reject(e)
                              }
                              resolve()
                          }
                      )
                      // placing 2nd bet calls requestRandomWords
                      await mockUSDC.transfer(bettor.address, entranceFee)
                      const duelConnectedContract = duel.connect(bettor)
                      const txResponse = await duelConnectedContract.enter()
                      const txReceipt = await txResponse.wait()
                      const deployerStartBalance = await mockUSDC.balanceOf(
                          deployer.address
                      )
                      const bettorStartBalance = await mockUSDC.balanceOf(
                          bettor.address
                      )
                      // fulfill
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[4].args.requestId,
                          duel.address
                      )
                  })
              })
          })
          describe("getters", function () {
              it("should get entrance fee", async function () {
                  const response = await duel.getEntranceFee()
                  assert.equal(response.toString(), entranceFee.toString())
              })
              it("should get rake", async function () {
                  const response = await duel.getRake()
                  assert.equal(response.toString(), "0")
              })
              it("should get vault address", async function () {
                  const response = await duel.getVaultAddress()
                  assert.equal(response, vault.address)
              })
              it("should get coordinator address", async function () {
                  const response = await duel.getCoordinatorAddress()
                  assert.equal(response, vrfCoordinatorV2Mock.address)
              })
              it("should get key hash", async function () {
                  const response = await duel.getKeyHash()
                  assert.equal(
                      response.toString(),
                      networkConfig[chainId]["vrfKeyHash"]
                  )
              })
              it("should get subscription id", async function () {
                  const response = await duel.getSubscriptionId()
                  assert.equal(
                      response.toString(),
                      network.config.subscriptionId.toString()
                  )
              })
          })
      })
