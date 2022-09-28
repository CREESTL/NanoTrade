// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;


/// @title Dividend-Paying Token Interface
 
/// @dev An interface for a dividend-paying token contract.
interface INano {


  /// @notice Distributes one token as dividends for holders of another token _equally _
  /// @param origToken The address of the token that is held by receivers
  ///        Can not be a zero address!
  /// @param distToken The address of the token that is to be distributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param amount The amount of distTokens to be distributed in total
  function distributeDividendsEqual(address origToken, address distToken, uint256 amount) external;

  /// @notice Distributes one token as dividends for holders of another token _according to each user's balance_
  /// @param origToken The address of the token that is held by receivers
  /// @param distToken The address of the token that is to be distributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param weight The amount of distTokens per single origToken on user's balance. Must be greater than or equal to 1!
  function distributeDividendsWeighted(address origToken, address distToken, uint256 weight) external;
  
  /// @notice Checks if provided weight is valid for current receivers
  /// @param origToken The address of the token that is held by receivers
  ///        Can not be a zero address!
  /// @param weight The amount of origTokens required to get a single distToken
  function checkWeight(address origToken, uint256 weight) external view;

  /// @notice Calculates the minimum currently allowed weight.
  ///         Weight used in distributing dividends should be equal/greater than this
  /// @param origToken The address of the token that is held by receivers
  function calcMinWeight(address origToken) external view returns(uint256);

  /// @dev Indicates that dividends were distributed
  /// @param distToken The address of the token that is to be distributed as dividends
  /// @param amount The amount of distTokens to be distributed in total
  event DividendsDistributed(
    address indexed distToken,
    // TODO add at least one not indexed field?
    uint256 indexed amount
  );
}