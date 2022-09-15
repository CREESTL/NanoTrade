// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;


/// @title Dividend-Paying Token Interface
 
/// @dev An interface for a dividend-paying token contract.
interface INano {


  /// @notice Distributes one token as dividends for holders of another token _equally _
  // TODO what if its too large? 
  /// @param receivers The list of addresses of all receivers of dividends
  /// @param distToken The address of the token that is to be disctributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param amount The amount of distTokens to be distributed in total
  function distributeDividendsEqual(address[] memory receivers, address distToken, uint256 amount) external;

  /// @notice Distributes one token as dividends for holders of another token _according to each user's balance_
  // TODO what if its too large? 
  /// @param receivers The list of addresses of all receivers of dividends
  /// @param origToken The address of the token that is held by receivers
  /// @param distToken The address of the token that is to be disctributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param amount The amount of distTokens to be distributed in total
  // TODO which way should the weight work? 
  /// @param weight The amount of distTokens per single origToken on user's balance. Must be greater than or equal to 1!
  function distributeDividendsWeighted(address[] memory receivers, address origToken, address distToken, uint256 amount, uint256 weight) external;
  
  /// @notice Calculates the maximum currently allowed weight.
  ///         Use this before distributing the dividends
  /// @param receivers The list of addresses of all receivers of dividends
  /// @param origToken The address of the token that is held by receivers
  /// @param amount The amount of distTokens to be distributed in total
  function calcMaxWeight(address[] memory receivers, address origToken, uint256 amount) external view returns(uint256);

  /// @dev Indicates that dividends were distributed
  /// @param distToken The address of the token that is to be disctributed as dividends
  /// @param amount The amount of distTokens to be distributed in total
  event DividendsDistributed(
    address indexed distToken,
    // TODO add at least one not indexed field?
    uint256 indexed amount
  );
}