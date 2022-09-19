// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ProducedToken.sol";
import "./interfaces/INanoFactory.sol";
import "./interfaces/INanoAdmin.sol";



/// @title A factory of custom ERC20 tokens
contract NanoFactory is Ownable, INanoFactory {

    /// @dev Address of token to clone
    address private producedToken;
    /// @dev Address of admin token to be minted to holders of cloned tokens
    address private adminToken;

    /// @dev Create a new token template to copy and upgrade it later
    /// @param _adminToken The address of admin token
    constructor(address _adminToken) {
        producedToken = address(new ProducedToken());
        adminToken = _adminToken;
    }


    /// @notice Creates a new ERC20 token and mints an admin token proving ownership
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
        ProducedToken(clonedToken).initialize(name, symbol, decimals, mintable, adminToken);

        // Mint admin token to the creator of this ERC20 token
        INanoAdmin(adminToken).mintWithERC20Address(msg.sender, clonedToken);
        
    }

}
