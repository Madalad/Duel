const { assert } = require("chai")
const { ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("MockUSDC", function () {
          let mockUSDC
          beforeEach(async function () {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["all"])
              mockUSDC = await ethers.getContract("MockUSDC", deployer.address)
          })
          it("should mint $100 to deployer", async function () {
              const deployerBalance = await mockUSDC.balanceOf(deployer.address)
              assert.equal(
                  deployerBalance.toString(),
                  (100 * 10 ** 6).toString()
              )
          })
          it("has 6 decimals", async function () {
              const decimals = await mockUSDC.decimals()
              assert.equal(decimals.toString(), "6")
          })
      })
