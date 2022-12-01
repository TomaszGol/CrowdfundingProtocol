//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

interface IFundRaisingFactory {
    event FeeChanged(uint256 oldFee, uint256 newFee);
    event OwnerChanged(address oldOwner, address newOwner);
    event ProjectCreated(
        bytes32 indexed id,
        address indexed projectAddress,
        string title,
        uint256 expires,
        uint256 amountToBack
    );

    function createProject(
        string calldata _title,
        uint256 _backAmount,
        uint256 _expires,
        string calldata tokenName,
        string calldata tokenSymbol
    ) external payable;

    function cancelProject(bytes32 projectId) external;

    function verifyProject(bytes32 projectId) external;
}
