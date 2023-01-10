// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IBentureProducedToken.sol";
import "./interfaces/IBentureAdmin.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract BentureProducedToken is ERC20, IBentureProducedToken {
    using EnumerableSet for EnumerableSet.AddressSet;

    string internal _tokenName;
    string internal _tokenSymbol;
    uint8 internal _decimals;
    bool internal _mintable;
    /// @dev The address of the admin token has to be provided in order
    ///      to verify user's ownership of that token
    address internal _adminToken;
    /// @dev The maximum number of tokens to be minted
    uint256 internal _maxTotalSupply;
    /// @dev A list of addresses of tokens holders
    EnumerableSet.AddressSet internal _holders;

    /// @dev Checks if mintability is activated
    modifier WhenMintable() {
        require(_mintable, "BentureProducedToken: the token is not mintable!");
        _;
    }

    /// @dev Checks if caller is an admin token holder
    modifier hasAdminToken() {
        require(IBentureAdmin(_adminToken).verifyAdminToken(msg.sender, address(this)), "BentureProducedToken: user does not have an admin token!");
        _;
    }

    /// @dev Creates a new controlled ERC20 token.
    /// @param name_ The name of the token
    /// @param symbol_ The symbol of the token
    /// @param decimals_ Number of decimals of the token
    /// @param mintable_ Token may be either mintable or not. Can be changed later.
    /// @param maxTotalSupply_ Maximum amount of tokens to be minted
    ///        Use `0` to create a token with no maximum amount
    /// @param adminToken_ Address of the admin token for controlled token
    /// @dev Only the factory can initialize controlled tokens
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        bool mintable_,
        uint256 maxTotalSupply_,
        address adminToken_
    ) ERC20(name_, symbol_) {
        require(
            bytes(name_).length > 0,
            "BentureProducedToken: initial token name can not be empty!"
        );
        require(
            bytes(symbol_).length > 0,
            "BentureProducedToken: initial token symbol can not be empty!"
        );
        require(
            decimals_ > 0,
            "BentureProducedToken: initial decimals can not be zero!"
        );
        require(
            adminToken_ != address(0),
            "BentureProducedToken: admin token address can not be a zero address!"
        );
        if (mintable_) {
            // If token is mintable it could either have a fixed maxTotalSupply or
            // have an "infinite" supply
            // ("infinite" up to max value of `uint256` type)
            if (maxTotalSupply_ == 0) {
                // If 0 value was provided by the user, that means he wants to create
                // a token with an "infinite" max total supply
                maxTotalSupply_ = type(uint256).max;
            }
        } else {
            require(
                maxTotalSupply_ == 0,
                "BentureProducedToken: max total supply must be zero for unmintable tokens!"
            );
        }
        _tokenName = name_;
        _tokenSymbol = symbol_;
        _decimals = decimals_;
        _mintable = mintable_;
        _maxTotalSupply = maxTotalSupply_;
        _adminToken = adminToken_;
    }

    /// @notice Returns the name of the token
    /// @return The name of the token
    function name()
        public
        view
        override(ERC20, IBentureProducedToken)
        returns (string memory)
    {
        return _tokenName;
    }

    /// @notice Returns the symbol of the token
    /// @return The symbol of the token
    function symbol()
        public
        view
        override(ERC20, IBentureProducedToken)
        returns (string memory)
    {
        return _tokenSymbol;
    }

    /// @notice Returns number of decimals of the token
    /// @return The number of decimals of the token
    function decimals()
        public
        view
        override(ERC20, IBentureProducedToken)
        returns (uint8)
    {
        return _decimals;
    }

    /// @notice Indicates whether the token is mintable or not
    /// @return True if the token is mintable. False - if it is not
    function mintable() external view override returns (bool) {
        return _mintable;
    }

    /// @notice Returns the array of addresses of all token holders
    /// @return The array of addresses of all token holders
    function holders() external view returns (address[] memory) {
        return _holders.values();
    }

    /// @notice Returns the max total supply of the token
    /// @return The max total supply of the token
    function maxTotalSupply() external view returns (uint256) {
        return _maxTotalSupply;
    }

    /// @notice Checks if the address is a holder
    /// @param account The address to check
    /// @return True if address is a holder. False if it is not
    function isHolder(address account) public view returns (bool) {
        return _holders.contains(account);
    }

    /// @notice Checks if user is an admin of this token
    /// @param account The address to check
    /// @return True if user has admin token. Otherwise - false.
    function checkAdmin(address account) public view returns(bool) {
        // This reverts. Does not return boolean.
        return IBentureAdmin(_adminToken).verifyAdminToken(account, address(this));
    }

    /// @notice Creates tokens and assigns them to account, increasing the total supply.
    /// @param to The receiver of tokens
    /// @param amount The amount of tokens to mint
    /// @dev Can only be called by the owner of the admin NFT
    /// @dev Can only be called when token is mintable
    function mint(
        address to,
        uint256 amount
    ) external override hasAdminToken WhenMintable {
        require(
            to != address(0),
            "BentureProducedToken: can not mint to zero address!"
        );
        require(
            totalSupply() + amount <= _maxTotalSupply,
            "BentureProducedToken: supply exceeds maximum supply!"
        );
        emit ControlledTokenCreated(to, amount);
        // Add receiver of tokens to holders list if he isn't there already
        _holders.add(to);
        // Mint tokens to the receiver anyways
        _mint(to, amount);
    }

    /// @notice Burns user's tokens
    /// @param amount The amount of tokens to burn
    function burn(uint256 amount) external override {
        address caller = msg.sender;
        require(
            amount > 0,
            "BentureProducedToken: the amount of tokens to burn must be greater than zero!"
        );
        require(
            balanceOf(caller) != 0,
            "BentureProducedToken: caller does not have any tokens to burn!"
        );
        emit ControlledTokenBurnt(caller, amount);
        _burn(caller, amount);
        // If caller does not have any tokens - remove the address from holders
        if (balanceOf(msg.sender) == 0) {
            bool removed = _holders.remove(caller);
            require(
                removed,
                "BentureProducedToken: deleting holder with zero balance failed!"
            );
        }
    }

    /// @notice Moves tokens from one account to another account
    /// @param from The address to transfer from
    /// @param to The address to transfer to
    /// @param amount The amount of tokens to be transferred
    /// @dev It is called by high-level functions. That is why it is necessary to override it
    /// @dev Transfers are permitted for everyone - not just admin token holders
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(
            from != address(0),
            "BentureProducedToken: sender can not be a zero address!"
        );
        require(
            to != address(0),
            "BentureProducedToken: receiver can not be a zero address!"
        );
        require(
            to != from,
            "BentureProducedToken: sender can not be a receiver!"
        );
        require(
            isHolder(from),
            "BentureProducedToken: sender does not have any tokens to transfer!"
        );
        emit ControlledTokenTransferred(from, to, amount);
        // If the receiver is not yet a holder, he becomes a holder
        _holders.add(to);
        // If all tokens of the holder get transferred - he is no longer a holder
        uint256 fromBalance = balanceOf(from);
        if (amount >= fromBalance) {
            bool removed = _holders.remove(from);
            require(
                removed,
                "BentureProducedToken: deleting holder with zero balance failed!"
            );
        }
        super._transfer(from, to, amount);
    }
}
