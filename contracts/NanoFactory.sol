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

    /// @dev Returns the address of the token that is produced by the factory
    /// @return The address of the token that is produced by the factory
    function producedToken() external view onlyOwner returns(address) {
        return _producedToken;
    }

    function onERC721Received() public view {}

    /// @notice Creates a new ERC20 token and mints an admin token proving ownership
    /// @param name The name of the token
    /// @param symbol The symbol of the token
    /// @param decimals Number of decimals of the token
    /// @param mintable Token may be either mintable or not. Can be changed later.
    /// @param initialSupply Initial supply of the token to be minted after initialization
    /// @param maxTotalSupply Maximum amount of tokens to be minted
    /// @param adminToken_ Address of the admin token for controlled token
    function createERC20Token(
        string memory name,
        string memory symbol,
        uint8 decimals,
        bool mintable,
        uint256 initialSupply,
        uint256 maxTotalSupply,
        address adminToken_
    ) external onlyOwner {

        // Give a random address as the second parameter because it does not really metter
        // After receiving this admin token the factory will be able to call `mint` function
        // of the ERC20 token (It is called inside the constructor of ERC20 token)
        INanoAdmin(adminToken_).mintWithERC20Address(address(this), address(this));

        // Factory is the owner of the token and can initialize it
        address newToken = address (new NanoProducedToken(
            name, 
            symbol, 
            decimals, 
            mintable, 
            initialSupply, 
            maxTotalSupply,
            adminToken_
        ));
        
        // Mint admin token to the creator of this ERC20 token
        INanoAdmin(adminToken_).mintWithERC20Address(msg.sender, newToken);
        
    }

}
