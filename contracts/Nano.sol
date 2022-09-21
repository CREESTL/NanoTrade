// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/INano.sol";


/// @title Dividend-Paying Token
/// @dev A mintable ERC20 token that allows anyone to pay and distribute ether
/// to token holders as dividends and allows token holders to withdraw their dividends.
contract Nano is INano, Ownable{

  /// @notice Distributes one token as dividends for holders of another token _equally _
  // TODO what if its too large? 
  /// @param receivers The list of addresses of all receivers of dividends
  /// @param distToken The address of the token that is to be disctributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param amount The amount of distTokens to be distributed in total
  function distributeDividendsEqual(address[] memory receivers, address distToken, uint256 amount) external onlyOwner {
    require(receivers.length > 0, "Nano: no dividends receivers provided!");
    uint256 length = receivers.length;
    for (uint256 i = 0; i < length; i++) {
      if (distToken == address(0)){
        // Native tokens (wei)
        (bool success, ) = receivers[i].call{value: amount / length}("");
        require(success, "Nano: dividends transfer failed!");
      } else {
        // Other ERC20 tokens
        IERC20(distToken).transfer(receivers[i], amount / length);
      }

    emit DividendsDistributed(distToken, amount);

    
    }
  }

  /// @notice Distributes one token as dividends for holders of another token _according to each user's balance_
  // TODO what if its too large? 
  /// @param receivers The list of addresses of all receivers of dividends
  /// @param origToken The address of the token that is held by receivers
  ///        Can not be a zero address!
  /// @param distToken The address of the token that is to be disctributed as dividends
  ///        Zero address for native token (ether, wei)
  /// @param weight The amount of origTokens required to get a single distToken
  function distributeDividendsWeighted(address[] memory receivers, address origToken, address distToken, uint256 weight) external onlyOwner {
    require(receivers.length > 0, "Nano: no dividends receivers provided!");
    require(origToken != address(0), "Nano: original token can not have a zero address!");
    // It is impossible to give distTokens for zero origTokens
    require(weight >= 1, "Nano; weight is too low!");
    uint256 totalWeightedAmount = 0;
    // This function reverts if weight is incorrect.
    calcMinWeight(receivers, origToken, weight);
    for (uint256 i = 0; i < receivers.length; i++) {
      uint256 userBalance = IERC20(origToken).balanceOf(receivers[i]);
      uint256 weightedAmount = userBalance / weight;
      totalWeightedAmount += weightedAmount;
      // If total assumed amount of tokens to be distributed as dividends is higher than current contract's balance, than it it impossible to
      // distribute dividends.
      require(totalWeightedAmount <= IERC20(distToken).balanceOf(address(this)), "Nano: not enough dividend tokens to distribute with the provided weight!");
      if (distToken == address(0)) {
        // Native tokens (wei)
        (bool success, ) = receivers[i].call{value: weightedAmount}("");
        require(success, "Nano: dividends transfer failed!");
      } else {
        // Other ERC20 tokens
        IERC20(distToken).transfer(receivers[i], weightedAmount);
      }
    }
    
    emit DividendsDistributed(distToken, totalWeightedAmount);
  
  }

  /// @notice Calculates the minimum currently allowed weight.
  ///         Weight used in distributing dividends should be equal/greater than this
  /// @param receivers The list of addresses of all receivers of dividends
  /// @param origToken The address of the token that is held by receivers
  /// @param weight The amount of origTokens required to get a single distToken
  function calcMinWeight(address[] memory receivers, address origToken, uint256 weight) public view returns(uint256) {
    // The highest balance of origTokens among receivers
    uint256 maxBalance = 0;
    for (uint256 i = 0; i < receivers.length; i++) {
      uint256 singleBalance = IERC20(origToken).balanceOf(receivers[i]);
      if (singleBalance > maxBalance) {
        maxBalance = singleBalance;
      }
    }
    // If the minimum balance of origTokens among all receivers is less than weight - that means that
    // none of the receivers will get any dividends
    require(weight <= maxBalance, "Nano: none of the receivers has enough tokens for current weight!");
    // Minimum weight is the highes balance
    uint256 minWeight = maxBalance;
    return minWeight;
  }


}