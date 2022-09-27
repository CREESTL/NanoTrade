// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./NanoProducedToken.sol";
import "./interfaces/INanoFactory.sol";
import "./interfaces/INanoAdmin.sol";



/// @title A factory of custom ERC20 tokens
contract NanoFactory is Ownable, INanoFactory, IERC721Receiver {

    /// @dev Address of token to clone
    address private _producedToken;

    /// @dev Create a new token template to copy and upgrade it later
    constructor() {
        _producedToken = address(new NanoProducedToken(address(this)));
    }

    /// @dev Returns the address of the token that is produced by the factory
    /// @return The address of the token that is produced by the factory
    function producedToken() external view onlyOwner returns(address) {
        return _producedToken;
    }

    /// @dev Allows this factory contract to receive admin tokens to manage controlled tokens
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    /// @notice Creates a new ERC20 token and mints an admin token proving ownership
    /// @param name The name of the token
    /// @param symbol The symbol of the token
    /// @param decimals Number of decimals of the token
    /// @param mintable Token may be either mintable or not. Can be changed later.
    /// @param maxTotalSupply Maximum amount of tokens to be minted
    /// @param adminToken_ Address of the admin token for controlled token
    /// @dev Anyone can call this method. No restrictions.
    function createERC20Token(
        string memory name,
        string memory symbol,
        uint8 decimals,
        bool mintable,
        uint256 maxTotalSupply,
        address adminToken_
    ) external {

        // Copy the template functionality and create a new token (proxy pattern)
        address clonedToken = Clones.clone(_producedToken);

        // Initialize a new token
        NanoProducedToken(clonedToken).initialize(
            name, 
            symbol, 
            decimals, 
            mintable, 
            maxTotalSupply,
            adminToken_
        );
        
        // Mint admin token to the creator of this ERC20 token
        INanoAdmin(adminToken_).mintWithERC20Address(msg.sender, clonedToken);
        
    }

}
