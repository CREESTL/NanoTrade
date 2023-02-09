// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

interface IBentureErrors {

    error NativeTokenDividendsTransferFailed();
    error PoolsCanNotHoldZeroAddressTokens();
    error PoolAlreadyExists();
    error CanNotWorkWithZeroAddressTokens();
    error CallerNotAdminOrFactory();
    error InvalidLockAmount();
    error CallerIsNotLocker();
    error CanNotLockZeroAddressTokens();
    error PoolDoesNotExist();
    error CanNotWorkWithEmptyLists();
    error ListsLengthDiffers();
    error WrongTokenInsideThePool();
    error UserDoesNotHaveProjectTokens();
    error TransferFailed();
    error InvalidUnlockAmount();
    error CanNotUnlockZeroAddressTokens();
    error UserDoesNotHaveAnyLockedTokens();
    error WithdrawAmountIsTooBig();
    error OriginalTokenCanNotHaveAZeroAddress();
    error UserDoesNotHaveAnAdminToken();
    error DividendsAmountCanNotBeZero();
    error NotEnoughNativeTokensWereProvided();
    error DistributionHasNotStartedYet();
    error InvalidDistribution();
    error UserHasNoLockedTokens();
    error AlreadyClaimed();
    error UserCanNotHaveZeroAddress();
    error AdminCanNotHaveAZeroAddress();
    error IDOfDistributionMustBeGreaterThanOne();
    error DistributionNotStarted();
    error DistriburionNotContainTokenToWithdraw();
    error FactoryAddressNotSet();
    error InvalidFactoryAddress();

}
