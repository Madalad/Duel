const { network } = require("hardhat")
const {
    developmentChains,
    BASE_FEE,
    GAS_PRICE_LINK,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")

        // deploy MockUSDC and FreeBetToken
        await deploy("MockUSDC", {
            contract: "MockUSDC",
            from: deployer,
            log: true,
            args: ["MockUSDC", "mUSDc"],
        })
        // deploy mock coordinator
        await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer, // account deploying the contract
            log: true, // console.log progress
            args: [BASE_FEE, GAS_PRICE_LINK], // contstructor arguments
        })

        log("Mocks deployed!")
        log("-----------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
