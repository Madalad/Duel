const { ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")
const { vrfCoordinatorFujiABI } = require("../constants.js")

/**
 * Adds the most recent Duel contract deployment as a consumer
 * Contract address and subscriptionID are pulled from config files
 * Network is specified in the terminal
 */
async function main() {
    const chainId = network.config.chainId
    const duelAddress = networkConfig[chainId]["duelAddress"]
    const vrfCoordinatorAddress =
        networkConfig[network.config.chainId]["vrfCoordinatorAddress"]

    const ContractFactory = await ethers.getContractFactory("Duel")
    duel = ContractFactory.attach(duelAddress)
    console.log("")
    console.log("Duel contract address:           ", duel.address)
    console.log("VRF Coordinator contract address:", vrfCoordinatorAddress)

    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const vrfCoordinatorV2 = new ethers.Contract(
        vrfCoordinatorAddress,
        vrfCoordinatorFujiABI,
        deployer
    )

    console.log("")
    console.log("Adding consumer...")
    const subscriptionId = network.config.subscriptionId
    try {
        const txResponse = await vrfCoordinatorV2.addConsumer(
            subscriptionId,
            duelAddress
        )
        const txReceipt = await txResponse.wait(2)
        if (txReceipt.events[0].event == "SubscriptionConsumerAdded") {
            console.log("Consumer successfully added!")
        } else {
            console.log("Consumer not added successfully.")
        }
    } catch (e) {
        console.log(e)
        console.log(
            "Remember to update the contract address in helper hardhat config file"
        )
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
