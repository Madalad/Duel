const { assert } = require("chai")
const { ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")
require("dotenv").config()

/**
 * Contract must be pre-deployed
 * Subscription must be set up and funded
 * Contract must be added as a consumer (see scripts/addConsumer.js)
 */
developmentChains.includes(network.name)
    ? describe.skip
    : describe("Duel staging tests", function () {
          const chainId = network.config.chainId
          let duel, mockUSDC, txResponse
          const duelAddress = networkConfig[chainId]["duelAddress"]
          const usdcAddress = networkConfig[chainId]["usdcAddress"]
          const blockConfirmations = network.config.blockConfirmations
          const rake = 100

          beforeEach(async function () {
              const { bettor } = await ethers.getNamedSigners()
              const Duel = await ethers.getContractFactory("Duel")
              duel = Duel.attach(duelAddress)
              const MockUSDCFactory = await ethers.getContractFactory(
                  "MockUSDC"
              )
              mockUSDC = MockUSDCFactory.attach(usdcAddress)

              console.log("")
              console.log(`Setting rake to ${(rake * 100) / 10000}%...`)
              txResponse = await duel.setRake(rake)
              txResponse.wait(blockConfirmations)
              console.log("Rake set.")
              console.log("")

              const entranceFee = await duel.getEntranceFee()
              txResponse = await mockUSDC.approve(duel.address, entranceFee)
              txResponse.wait(blockConfirmations)
              txResponse = await mockUSDC
                  .connect(bettor)
                  .approve(duel.address, entranceFee)
              txResponse.wait(blockConfirmations)

              console.log("")
              console.log("Duel contract address:     ", duel.address)
              console.log("MockUSDC contract address: ", mockUSDC.address)
              console.log("")
              console.log("Block confirmations:", blockConfirmations)
              console.log("")
          })
          it("should accept bets, pick a winner, take a rake then payout", async function () {
              const { deployer, bettor, vault } = await ethers.getNamedSigners()
              const deployerStartBalance = await mockUSDC.balanceOf(
                  deployer.address
              )
              const bettorStartBalance = await mockUSDC.balanceOf(
                  bettor.address
              )
              const vaultStartBalance = await mockUSDC.balanceOf(vault.address)

              console.log(
                  "Contract balance:",
                  (await mockUSDC.balanceOf(duel.address)).toString()
              )
              console.log("Deployer balance:", deployerStartBalance.toString())
              console.log("Bettor balance:  ", bettorStartBalance.toString())
              console.log("Vault balance:   ", vaultStartBalance.toString())
              console.log("")

              console.log("Entering...")
              await duel.enter()
              console.log("Deployer entered.")
              await new Promise(async (resolve, reject) => {
                  duel.once("RoundSettled", async () => {
                      try {
                          console.log("Round settled!")
                          console.log(
                              `Seconds to settle: ${
                                  (new Date().getTime() - now) / 1000
                              }`
                          )
                          console.log("")

                          const contractEndBalance = await mockUSDC.balanceOf(
                              duel.address
                          )
                          const deployerEndBalance = await mockUSDC.balanceOf(
                              deployer.address
                          )
                          const bettorEndBalance = await mockUSDC.balanceOf(
                              bettor.address
                          )
                          const vaultEndBalance = await mockUSDC.balanceOf(
                              vault.address
                          )

                          console.log(
                              "Contract balance:",
                              contractEndBalance.toString()
                          )
                          console.log(
                              "Deployer balance:",
                              deployerEndBalance.toString()
                          )
                          console.log(
                              "Bettor balance:  ",
                              bettorEndBalance.toString()
                          )
                          console.log(
                              "Vault balance:   ",
                              vaultEndBalance.toString()
                          )

                          const entranceFee = await duel.getEntranceFee()
                          assert.equal(contractEndBalance.toString(), "0")
                          assert(
                              deployerEndBalance.toString() ==
                                  deployerStartBalance.add(
                                      entranceFee -
                                          (2 * entranceFee * rake) / 10000
                                  ) ||
                                  deployerEndBalance.toString() ==
                                      deployerStartBalance
                                          .sub(entranceFee)
                                          .toString()
                          )
                          assert(
                              bettorEndBalance.toString() ==
                                  bettorStartBalance.add(
                                      entranceFee -
                                          (2 * entranceFee * rake) / 10000
                                  ) ||
                                  bettorEndBalance.toString() ==
                                      bettorStartBalance
                                          .sub(entranceFee)
                                          .toString()
                          )
                          assert(
                              vaultEndBalance.toString(),
                              ((entranceFee * 2 * rake) / 10000).toString()
                          )

                          // empty the vault
                          if (deployerEndBalance.gt(deployerStartBalance)) {
                              await mockUSDC
                                  .connect(vault)
                                  .transfer(deployer.address, vaultEndBalance)
                          } else {
                              await mockUSDC
                                  .connect(vault)
                                  .transfer(bettor.address, vaultEndBalance)
                          }
                      } catch (e) {
                          reject(e)
                      }
                      resolve()
                  })
                  await duel.connect(bettor).enter()
                  const now = new Date().getTime()
                  console.log("Bettor entered.")
                  console.log("")
                  console.log(
                      "Contract balance:",
                      (await mockUSDC.balanceOf(duel.address)).toString()
                  )
                  console.log(
                      "Deployer balance:",
                      (await mockUSDC.balanceOf(deployer.address)).toString()
                  )
                  console.log(
                      "Bettor balance:  ",
                      (await mockUSDC.balanceOf(bettor.address)).toString()
                  )
                  console.log(
                      "Vault balance:   ",
                      (await mockUSDC.balanceOf(vault.address)).toString()
                  )
                  console.log("")
                  console.log("Awaiting settlement...")
              })
          })
      })
