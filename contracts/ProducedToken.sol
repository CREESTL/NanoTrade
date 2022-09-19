// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/IProducedToken.sol";
import "./interfaces/INanoAdmin.sol";

contract ProducedToken is ERC20, Initializable, IProducedToken {

    string internal _tokenName;
    string internal _tokenSymbol;
    uint8 internal _decimals;
    bool internal _mintable;
    /// @dev The address of the admin tokens has to be provided in order
    ///      to verify user's ownership of that token
    address internal _adminToken;

    /// @dev Checks if mintability is activated
    modifier WhenMintable() { 
        require (_mintable, "ProducedToken: the token is not mintable!"); 
        _; 
    }


    /// @dev Checks if caller is an admin token holder
    modifier hasAdminToken() {
        // Get the ID of the admin token the caller has. If any.
        uint256 tokenId = INanoAdmin(_adminToken).checkOwner(msg.sender);
        // Get the address of the controlled token
        address contolledAddress = INanoAdmin(_adminToken).getControlledAddressById(tokenId);
        // Compare the previous address of the controlled token with the address of this contract
        require(contolledAddress == address(this), "ProducedToken: caller does not have an admin token!");
        _;
    }

    /// @dev Creates an "empty" template token that will be cloned in the future
    constructor() ERC20("", "") {}

    /// @dev Upgrades an "empty" template. Initializes internal variables. 
    /// @param name_ The name of the token
    /// @param symbol_ The symbol of the token
    /// @param decimals_ Number of decimals of the token
    /// @param mintable_ Token may be either mintable or not. Can be changed later.
    function initialize(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        bool mintable_,
        address adminToken_
    ) external initializer onlyOwner {
        require(bytes(name_).length > 0, "ProducedToken: initial token name can not be empty!");
        require(bytes(symbol_).length > 0, "ProducedToken: initial token symbol can not be empty!");
        require(decimals_ > 0, "ProducedToken: initial decimals can not be zero!");
        require(adminToken_ != address(0), "ProducedToken: admin token address can not be a zero address!");
        _tokenName = name_;
        _tokenSymbol = symbol_;
        _decimals = decimals_;
        _mintable = mintable_;
        _adminToken = adminToken_;
    }


    /// @notice Returns the name of the token
    /// @return The name of the token
    function name() public view override(ERC20, IProducedToken) returns(string memory) {
        return _tokenName;
    }

    /// @notice Returns the symbol of the token
    /// @return The symbol of the token
    function symbol() public view override(ERC20, IProducedToken) returns(string memory) {
        return _tokenSymbol;
    }

    /// @notice Returns number of decimals of the token
    /// @return The number of decimals of the token
    function decimals() public view override(ERC20, IProducedToken) returns(uint8) {
        return _decimals;
    }

    /// @notice Indicates whether the token is mintable or not
    /// @return True if the token is mintable. False - if it is not
    function mintable() public view override returns(bool) {
        return _mintable;
    }

    /// @notice Creates tokens and assigns them to account, increasing the total supply.
    /// @param to The receiver of tokens
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external override hasAdminToken WhenMintable {
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /// @notice Makes the token mintable or not mintable
    /// @param mintable_ Mintable status: true of false
    function setMintable(bool mintable_) public hasAdminToken {
        _mintable = mintable_;
        emit MintabilityChanged(mintable_);
    }

}
