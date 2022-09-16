// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ProducedToken.sol";
import "./interfaces/INanoFactory.sol";


/// @title A factory of custom ERC20 tokens
contract NanoFactory is Ownable, INanoFactory {

    /// @dev Address of token to clone
    address private producedToken;

    /// @dev Create a new token template to copy and upgrade it later
    constructor() {
        producedToken = address(new ProducedToken());
    }


    /// @notice Creates a new ERC20 token
    /// @param name The name of the token
    /// @param symbol The symbol of the token
    /// @param decimals Number of decimals of the token
    /// @param mintable Token may be either mintable or not. Can be changed later.
    /// @dev Only the owner can create new tokens
    function createERC20Token(
        string memory name,
        string memory symbol,
        uint8 decimals,
        bool mintable
    ) external onlyOwner {

        // Copy the template functionality and create a new token (proxy pattern)
        address clonedToken = Clones.clone(producedToken);
        ProducedToken(clonedToken).initialize(name, symbol, decimals, mintable);
        
    }

}
