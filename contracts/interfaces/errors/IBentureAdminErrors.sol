// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

interface IBentureAdminErrors {

    error CallerIsNotAFactory();
    error FactoryAddressCanNotBeZeroAddress();
    error ZeroAddressIsAnInvalidUser();
    error UserDoesNotHaveAnAdminToken();
    error UserCanNotHaveAZeroAddress();
    error TokenCanNotHaveAZeroAddress();
    error NoControlledTokenExistsForThisAdminToken();
    error AdminAddressCanNotBeAZeroAddress();
    error ControlledTokenCanNotHaveAZeroAddress();
    error FailedToDeleteTokenID();
    error AdminTokenMintToZeroAddressIsNotAllowed();
    error OnlyASingleAdminTokenIsAllowedForASingleControlledToken();
    error OnlyOwnerOfTheTokenIsAllowedToBurnIt();
    error SenderCanNotBeAZeroAddress();
    error ReceiverCanNotBeAZeroAddress();

}
