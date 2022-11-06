//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

interface IProjectFundRaising {
    event ProjectCreated(
        uint256 _id,
        string _title,
        uint256 _backAmount,
        uint256 _expires
    );
    event ProjectBacked(address backers, uint256 backValue);
    event fundsWithdrawedByOwner(address owner, uint256 withdrawedAmount);
    event fundsWithdrawedByBacker(address backer, uint256 withdrawedAmount);

    function backProject() external payable;

    function ownerWithdrawFunds() external payable;

    function backerWithdrawFunds() external payable;
}
