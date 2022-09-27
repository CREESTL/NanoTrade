// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./interfaces/INanoProducedToken.sol";
import "./interfaces/INanoAdmin.sol";

contract NanoProducedToken is ERC20, INanoProducedToken, Initializable {

    string internal _tokenName;
    string internal _tokenSymbol;
    uint8 internal _decimals;
    bool internal _mintable;
    /// @dev The address of the admin tokens has to be provided in order
    ///      to verify user's ownership of that token
    address internal _adminToken;
    /// @dev Both mintable and unmintable tokens have initial supply
    uint256 internal _initialSupply;
    /// @dev Should be equal to `_initialSupply` for unmintable tokens
    uint256 internal _maxTotalSupply;
    /// @dev A list of addresses of tokens holders
    address[] internal _holders;
    /// @dev A mapping of holder's address and his position in `_holders` list
    mapping(address => uint256) internal _holdersIndexes;
    /// @dev The address of the factory minting controlled tokens
    address private _factoryAddress;

    /// @dev Checks if mintability is activated
    modifier WhenMintable() { 
        require (_mintable, "NanoProducedToken: the token is not mintable!"); 
        _; 
    }

    /// @dev Checks if caller is a factory address
    modifier onlyFactory() {
        require(msg.sender == _factoryAddress, "NanoProducedToken: caller is not a factory!");
        _;
    }

    /// @dev Checks if caller is an admin token holder
    modifier hasAdminToken() {
        // Get the ID of the admin token the caller has. If any.
        uint256 tokenId = INanoAdmin(_adminToken).checkOwner(msg.sender);
        // Get the address of the controlled token
        address contolledAddress = INanoAdmin(_adminToken).getControlledAddressById(tokenId);
        // Compare the previous address of the controlled token with the address of this contract
        require(contolledAddress == address(this), "NanoProducedToken: caller does not have an admin token!");
        _;
    }


    //

    /// @dev Creates an "empty" template token that will be cloned in the future
    /// @param factoryAddress_ The address of the factory minting controlled tokens
    constructor(address factoryAddress_) ERC20("", "") {
        require(factoryAddress_ != address(0), "NanoProducedToken: factory address can not be zero address!");
        _factoryAddress = factoryAddress_;
    }


    /// @dev Upgrades an "empty" template. Initializes internal variables. 
    /// @dev Only the owner (factory) can initialize the token
    /// @param name_ The name of the token
    /// @param symbol_ The symbol of the token
    /// @param decimals_ Number of decimals of the token
    /// @param mintable_ Token may be either mintable or not. Can be changed later.
    /// @param initialSupply_ Initial supply of the token to be minted after initialization
    /// @param maxTotalSupply_ Maximum amount of tokens to be minted
    /// @param adminToken_ Address of the admin token for controlled token
    /// @dev Only the factory can initialize controlled tokens
    function initialize (
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        bool mintable_,
        uint256 initialSupply_,
        uint256 maxTotalSupply_,
        address adminToken_
    ) external initializer onlyFactory {
        require(bytes(name_).length > 0, "NanoProducedToken: initial token name can not be empty!");
        require(bytes(symbol_).length > 0, "NanoProducedToken: initial token symbol can not be empty!");
        require(decimals_ > 0, "NanoProducedToken: initial decimals can not be zero!");
        require(adminToken_ != address(0), "NanoProducedToken: admin token address can not be a zero address!");
        require(initialSupply_ >= 0, "NanoProducedToken: inital token supply must be greater than 0!");
        if (mintable_) {
            // If token is unmintable, `maxTotalSupply` must be equal to `initialSupply`
            require(maxTotalSupply_ == initialSupply_, "NanoProducedToken: max total supply must be equal to initial supply!");
        } else {
            // If token is mintable, `maxTotalSupply` must be equal to or greater than `initialSupply`
            require(maxTotalSupply_ >= initialSupply_, "NanoProducedToken: max total supply can not be less than initial supply!");
        }
        _tokenName = name_;
        _tokenSymbol = symbol_;
        _decimals = decimals_;
        _mintable = mintable_;
        _initialSupply = initialSupply_;
        _maxTotalSupply = maxTotalSupply_;
        _adminToken = adminToken_;

    }


    /// @notice Returns the name of the token
    /// @return The name of the token
    function name() public view override(ERC20, INanoProducedToken) returns(string memory) {
        return _tokenName;
    }

    /// @notice Returns the symbol of the token
    /// @return The symbol of the token
    function symbol() public view override(ERC20, INanoProducedToken) returns(string memory) {
        return _tokenSymbol;
    }

    /// @notice Returns number of decimals of the token
    /// @return The number of decimals of the token
    function decimals() public view override(ERC20, INanoProducedToken) returns(uint8) {
        return _decimals;
    }

    /// @notice Indicates whether the token is mintable or not
    /// @return True if the token is mintable. False - if it is not
    function mintable() public view override returns(bool) {
        return _mintable;
    }

    /// @notice Returns the array of addresses of all token holders
    /// @return The array of addresses of all token holders
    function holders() public view hasAdminToken returns (address[] memory) {
        return _holders;
    }

    /// @notice Creates tokens and assigns them to account, increasing the total supply.
    /// @param to The receiver of tokens
    /// @param amount The amount of tokens to mint
    /// @dev Can only be called by the owner of the admin NFT
    function mint(address to, uint256 amount) public override hasAdminToken WhenMintable {
        require(totalSupply() + amount <= _maxTotalSupply, "NanoProducedToken: supply exceeds maximum supply!");
        // Push another address to the end of the array
        _holders.push(to);
        // Remember this address position
        _holdersIndexes[to] = _holders.length - 1;
        _mint(to, amount);
        emit ControlledTokenCreated(to, amount);
    }

    /// @notice Burns tokens, reducing the total supply.
    /// @param from The address to burn tokens from
    /// @param amount The amount of tokens to burn
    /// @dev Can only be called by the owner of the admin NFT
    function burn(address from, uint256 amount) public override hasAdminToken {
        require(_holders[_holdersIndexes[from]] != address(0), "NanoProducedToken: tokens have already been burnt!");
        // Get the addresses position and delete it from the array
        delete _holders[_holdersIndexes[from]];
        _burn(from, amount);
        emit ControlledTokenBurnt(from, amount);
    }

}
