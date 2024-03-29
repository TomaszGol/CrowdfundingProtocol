//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

interface IProjectFundRaising {
    event ProjectCreated(
        bytes32 id,
        string title,
        uint256 backAmount,
        uint256 expires
    );
    event ProjectBacked(address indexed backers, uint256 backValue);
    event FundsWithdrawedByOwner(address owner, uint256 withdrawedAmount);
    event FundsWithdrawedByBacker(address backer, uint256 withdrawedAmount);
    event ProjectVeryfied(bytes32 id);
    event ProjectCanceled(bytes32 id);

    enum projectStatus {
        UNDEFINED,
        VERYFIED,
        CANCELED
    }

    function backProject() external payable;

    function ownerWithdrawFunds() external payable;

    function backerWithdrawFunds() external payable;
}
