// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title A custom ERC20 contract used in the bridge
contract Dummy is ERC20 {

    /// @dev Creates an "empty" template token that will be cloned in the future
    constructor() ERC20("", "") {}

    function giveTokens(address receiver, uint256 amount) external {
        super._mint(receiver, amount);
    }
}
