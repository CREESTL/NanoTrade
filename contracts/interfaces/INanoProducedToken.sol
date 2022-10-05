// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/// @title An interface for a custom ERC20 contract used in the bridge
interface INanoProducedToken is IERC20 {

    /// @notice Returns the name of the token
    /// @return The name of the token
    function name() external view returns(string memory);

    /// @notice Returns the symbol of the token
    /// @return The symbol of the token
    function symbol() external view returns(string memory);

    /// @notice Returns number of decimals of the token
    /// @return The number of decimals of the token
    function decimals() external view returns(uint8);

    /// @notice Indicates whether the token is mintable or not
    /// @return True if the token is mintable. False - if it is not
    function mintable() external view returns(bool);

    /// @notice Returns the array of addresses of all token holders
    /// @return The array of addresses of all token holders
    function holders() external view returns (address[] memory);

    /// @notice Creates tokens and assigns them to account, increasing the total supply.
    /// @param to The receiver of tokens
    /// @param amount The amount of tokens to mint
    /// @dev Can only be called by the owner of the admin NFT
    /// @dev Can only be called when token is mintable
    function mint(address to, uint256 amount) external;

    /// @notice Burns user's tokens
    /// @param amount The amount of tokens to burn
    function burn(uint256 amount) external;

    /// @notice Indicates that a new ERC20 was created
    event ControlledTokenCreated(address indexed account, uint256 amount);

    /// @notice Indicates that a new ERC20 was burnt
    event ControlledTokenBurnt(address indexed account, uint256 amount);
    
    /// @notice Indicates that a new ERC20 was transfered
    event ControlledTokenTransferred(address indexed from, address indexed to, uint256 amount);

}
