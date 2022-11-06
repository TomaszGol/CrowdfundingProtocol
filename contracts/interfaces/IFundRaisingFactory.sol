//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

interface IFundRaisingFactory {
    event FeeChanged(uint256 oldFee, uint256 newFee);
    event OwnerChanged(address oldOwner, address newOwner);
    event ProjectCreated(string _title, uint256 expires, uint256 amountToBack);

    function createProject(
        string memory _title,
        uint256 _backAmount,
        uint256 _expires,
        string memory tokenName,
        string memory tokenSymbol
    ) external payable;

    function isProjectExists(uint256 projectId) external returns (bool);
}
