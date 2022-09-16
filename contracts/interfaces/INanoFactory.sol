// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/// @title An interface of a factory of custom ERC20 tokens
interface INanoFactory {

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
    ) external;

    
    /// @dev Event gets emmited each time a new ERC20 token is created
    event CreateERC20Token(
        string indexed name,
        string indexed symbol,
        uint8 decimals,
        bool mintable
    );
}
