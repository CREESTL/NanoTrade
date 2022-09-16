// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/IProducedToken.sol";


contract ProducedToken is ERC20, Ownable, Initializable, IProducedToken {

    string internal _tokenName;
    string internal _tokenSymbol;
    uint8 internal _decimals;
    bool internal _mintable;

    modifier WhenMintable() { 
        require (_mintable); 
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
        bool mintable_
    ) external initializer {
        require(bytes(name_).length > 0, "ERC20: initial token name can not be empty!");
        require(bytes(symbol_).length > 0, "ERC20: initial token symbol can not be empty!");
        require(decimals_ > 0, "ERC20: initial decimals can not be zero!");
        _tokenName = name_;
        _tokenSymbol = symbol_;
        _decimals = decimals_;
        _mintable = mintable_;
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
    function mint(address to, uint256 amount) external override onlyOwner WhenMintable {
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /// @notice Makes the token mintable or not mintable
    /// @param mintable_ Mintable status: true of false
    function setMintable(bool mintable_) public onlyOwner {
        _mintable = mintable_;
        emit MintabilityChanged(mintable_);
    }

}
