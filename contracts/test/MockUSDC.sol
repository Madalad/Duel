// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/** @title A custom ERC20 intended to mimic USDC
 */
contract MockUSDC is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 100 * 10 ** 6);
    }

    function decimals() public view virtual override returns(uint8) {
        return 6;
    }
}