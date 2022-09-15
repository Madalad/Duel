const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
require("dotenv").config()

const VRF_SUBSCRIPTION_FUND_AMOUNT = ethers.utils.parseEther("30")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer, vault } = await getNamedAccounts()
    const chainId = network.config.chainId

    //const subscriptionId = network.config.subscriptionId
    const keyHash = networkConfig[chainId]["vrfKeyHash"]
    const vaultAddress = vault

    let vrfCoordinatorAddress, usdcAddress, subscriptionId, VRFCoordinatorV2Mock

    if (developmentChains.includes(network.name)) {
        VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        const mockUSDC = await ethers.getContract("MockUSDC")
        usdcAddress = mockUSDC.address
        // create subscription
        const txResponse = await VRFCoordinatorV2Mock.createSubscription()
        const txReceipt = await txResponse.wait(1)
        subscriptionId = txReceipt.events[0].args.subId
        // fund subscription
        await VRFCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            VRF_SUBSCRIPTION_FUND_AMOUNT
        )
        vrfCoordinatorAddress = VRFCoordinatorV2Mock.address
    } else {
        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinatorAddress"]
        usdcAddress = networkConfig[chainId]["usdcAddress"]
        subscriptionId = network.config.subscriptionId
    }

    const entranceFee = 5 * 10 ** 6 // $5
    const rake = 0

    const duel = await deploy("Duel", {
        from: deployer,
        args: [
            usdcAddress,
            entranceFee,
            subscriptionId,
            keyHash,
            vrfCoordinatorAddress,
            rake,
            vaultAddress,
        ],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log(VRFCoordinatorV2Mock.address)

    /*if (developmentChains.includes(network.name)) {
        // add consumer
        await VRFCoordinatorV2Mock.addConsumer(subscriptionId, duel.address)
    }*/

    log("---------------------------------")
}

module.exports.tags = ["all", "duel"]
