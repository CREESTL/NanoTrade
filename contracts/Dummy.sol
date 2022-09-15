// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title A simple ERC20 used for test purposes
contract Dummy is ERC20 {

    constructor() ERC20("Dummy", "DMM") {}

    function giveTokens(address receiver, uint256 amount) external {
        super._mint(receiver, amount);
    }
}
