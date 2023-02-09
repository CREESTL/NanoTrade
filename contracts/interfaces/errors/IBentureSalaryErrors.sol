// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

interface IBentureSalaryErrors {

    error ZeroAddress();
    error NotAllowedToSetName();
    error EmptyName();
    error NotAllowedToRemoveName();
    error UserAllreadyIsEmployee();
    error AlreadyNotAnEmployee();
    error NotEmployeeForThisSalary();
    error NotAnAdminForEmployee();
    error SalaryEnded();
    error NotEnoughTokensAllowed();
    error AmountOfPeriodsNotEqualTokensAmmountPerPeriod();
    error NotAnAdminForThisSalary();


}
