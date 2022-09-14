// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;


/// @title Dividend-Paying Token Optional Interface
 
/// @dev OPTIONAL functions for a dividend-paying token contract.
interface INanoOptional {
  /// @notice View the amount of dividend in wei that an address can withdraw.
  /// @param owner The address of a token holder.
  /// @return The amount of dividend in wei that `owner` can withdraw.
  function withdrawableDividendOf(address owner) external view returns(uint256);

  /// @notice View the amount of dividend in wei that an address has withdrawn.
  /// @param owner The address of a token holder.
  /// @return The amount of dividend in wei that `owner` has withdrawn.
  function withdrawnDividendOf(address owner) external view returns(uint256);

  /// @notice View the amount of dividend in wei that an address has earned in total.
  /// @dev accumulativeDividendOf(owner) = withdrawableDividendOf(owner) + withdrawnDividendOf(owner)
  /// @param owner The address of a token holder.
  /// @return The amount of dividend in wei that `owner` has earned in total.
  function accumulativeDividendOf(address owner) external view returns(uint256);
}