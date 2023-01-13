//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./libraries/EnumerableMapBytes32ToAddress.sol";
import "./interfaces/IFundRaisingFactory.sol";
import "./ProjectFundRaising.sol";
import "./ContractControlList.sol";

contract FundRaisingFactory is IFundRaisingFactory {
    using EnumerableMapBytes32ToAddress for EnumerableMapBytes32ToAddress.Bytes32ToAddress;

    ContractControlList public ccl;

    uint256 public feeSetting;
    address public defaultOwner;

    EnumerableMapBytes32ToAddress.Bytes32ToAddress internal projects;

    constructor(ContractControlList _ccl, uint256 _fee) {
        ccl = _ccl;
        feeSetting = _fee;
        defaultOwner = msg.sender;
    }

    modifier onlyAdminRole(address addr) {
        require(
            ccl.hasFundRaisingAdminRole(addr),
            "FundRaisingFactory: Caller is not the owner"
        );
        _;
    }

    modifier onlyAdminOrModeratorRole(address addr) {
        require(
            ccl.hasFundRaisingAdminRole(addr) ||
                ccl.hasFundRaisingModeratorRole(addr),
            "FundRaisingFactory: Caller is not the owner nor moderator"
        );
        _;
    }

    function changeFee(uint256 newFee) external onlyAdminRole(msg.sender) {
        uint256 currentFee = feeSetting;
        feeSetting = newFee;

        emit FeeChanged(currentFee, feeSetting);
    }

    function createProject(
        string calldata _title,
        uint256 _backAmount,
        uint256 _expires,
        string calldata _tokenName,
        string calldata _tokenSymbol
    ) external payable override {
        bytes32 hashedTitle = keccak256(abi.encode(_title));
        require(
            !projects.contains(hashedTitle),
            "FundRaisingFactory: Project with this title alreadt exists"
        );
        require(
            _expires > block.timestamp && _expires <= block.timestamp + 2629743,
            "FundRaisingFactory: Expiratrion date is not correct"
        );
        require(
            _backAmount >= 1 ether,
            "FundRaisingFactory: Ammount to raise should be higher than 1 ETH"
        );

        ProjectFundRaising newProject = new ProjectFundRaising(
            msg.sender,
            hashedTitle,
            _title,
            _backAmount,
            _expires,
            _tokenName,
            _tokenSymbol
        );
        //Take fee
        uint256 feeValue;
        unchecked {
            feeValue = (_backAmount * feeSetting) / 100;
        }
        require(
            msg.value >= feeValue,
            "FundRaisingFactory: Message value is lower than fee"
        );
        payable(defaultOwner).transfer(msg.value);

        bool result = projects.set(hashedTitle, address(newProject));

        emit ProjectCreated(
            hashedTitle,
            address(newProject),
            _title,
            _expires,
            _backAmount
        );
    }

    function isProjectExists(bytes32 hashedTitle) external view returns (bool) {
        return projects.contains(hashedTitle);
    }

    function getProject(bytes32 hashedTitle) public view returns (address) {
        return projects.get(hashedTitle);
    }

    function cancelProject(
        bytes32 hashedTitle
    ) external override onlyAdminOrModeratorRole(msg.sender) {
        ProjectFundRaising project = ProjectFundRaising(
            getProject(hashedTitle)
        );
        project.cancelProject();
    }

    function verifyProject(
        bytes32 hashedTitle
    ) external override onlyAdminOrModeratorRole(msg.sender) {
        ProjectFundRaising project = ProjectFundRaising(
            getProject(hashedTitle)
        );
        project.verifyProject();
    }
}
