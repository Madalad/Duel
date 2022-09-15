const developmentChains = ["hardhat", "localhost"]
const BASE_FEE = 100000
const GAS_PRICE_LINK = 100000
const networkConfig = {
    1: {
        name: "mainnet",
        vrfCoordinatorAddress: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
        vrfKeyHash:
            "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
        usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    4: {
        name: "rinkeby",
        vrfCoordinatorAddress: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        vrfKeyHash:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        usdcAddress: "0x7fA74B4b920f24386b7f25128C87909944fA7aF0", // MockUSD.sol
    },
    31337: {
        name: "hardhat",
        vrfKeyHash:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    },
    43114: {
        name: "avalanche",
        vrfCoordinatorAddress: "0xd5D517aBE5cF79B7e95eC98dB0f0277788aFF634",
        vrfKeyHash:
            "0x83250c5584ffa93feb6ee082981c5ebe484c865196750b39835ad4f13780435d",
        usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC
    },
    43113: {
        name: "fuji", // avalanche testnet
        vrfCoordinatorAddress: "0x2eD832Ba664535e5886b75D64C46EB9a228C2610",
        vrfKeyHash:
            "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61",
        usdcAddress: "0xc388369F00833F7da50a4476e21849c7E8EdDA23", // MockUSD.sol
    },
}

module.exports = {
    developmentChains,
    BASE_FEE,
    GAS_PRICE_LINK,
    networkConfig,
}
