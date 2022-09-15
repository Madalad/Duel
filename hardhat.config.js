require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("hardhat-deploy")

/** @type import('hardhat/config').HardhatUserConfig */

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const PRIVATE_KEY2 = process.env.PRIVATE_KEY2
const PRIVATE_KEY3 = process.env.PRIVATE_KEY3
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const RINKEBY_SUBSCRIPTION_ID = process.env.RINKEBY_SUBSCRIPTION_ID
const FUJI_SUBSCRIPTION_ID = process.env.FUJI_SUBSCRIPTION_ID
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
const AVALANCHE_RPC_URL = process.env.AVALANCHE_RPC_URL
const FUJI_RPC_URL = process.env.FUJI_RPC_URL

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            subscriptionId: 1,
        },
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY2, PRIVATE_KEY3],
            chainId: 4,
            blockConfirmations: 1,
            subscriptionId: RINKEBY_SUBSCRIPTION_ID,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY2, PRIVATE_KEY3],
            chainId: 5,
            blockConfirmations: 6,
        },
        avalanche: {
            url: AVALANCHE_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY2, PRIVATE_KEY3],
            chainId: 43114,
            blockConfirmations: 6,
        },
        fuji: {
            url: FUJI_RPC_URL,
            accounts: [PRIVATE_KEY, PRIVATE_KEY2, PRIVATE_KEY3],
            chainId: 43113,
            blockConfirmations: 1,
            subscriptionId: FUJI_SUBSCRIPTION_ID,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
            },
            {
                version: "0.8.4",
            },
        ],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: false,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "AVAX",
    },
    namedAccounts: {
        deployer: {
            default: 0,
            1: 0,
        },
        bettor: {
            default: 1,
            1: 0,
        },
        vault: {
            default: 2,
            1: 0,
        },
    },
    mocha: {
        timeout: 300000,
    },
}
