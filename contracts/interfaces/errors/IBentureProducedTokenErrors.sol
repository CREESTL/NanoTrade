// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

interface IBentureProducedTokenErrors {

    error TheTokenIsNotMintable();
    error UserDoesNotHaveAnAdminToken();
    error InitialTokenNameCanNotBeEmpty();
    error InitialTokenSymbolCanNotBeEmpty();
    error InitialDecimalsCanNotBeZero();
    error AdminTokenAddressCanNotBeAZeroAddress();
    error MaxTotalSupplyMustBeZeroForUnmintableTokens();
    error CanNotMintToZeroAddress();
    error SupplyExceedsMaximumSupply();
    error TheAmountOfTokensToBurnMustBeGreaterThanZero();
    error CallerDoesNotHaveAnyTokensToBurn();
    error DeletingHolderWithZeroBalanceFailed();
    error SenderCanNotBeAZeroAddress();
    error ReceiverCanNotBeAZeroAddress();
    error SenderCanNotBeAReceiver();
    error SenderDoesNotHaveAnyTokensToTransfer();


}
