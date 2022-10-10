// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../BentureFactory.sol";

// An ERC20 factory capable of receiving ether
contract PayableFactory is BentureFactory {

    receive() external payable {}

    function withdraw() external {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success);
    }

}
