//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";

import "./interfaces/IProjectFundRaising.sol";
import "./ERC20Token.sol";

contract ProjectFundRaising is IProjectFundRaising {
    using EnumerableMap for EnumerableMap.AddressToUintMap;

    EnumerableMap.AddressToUintMap internal backers;

    ERC20Token internal erc20token;

    uint256 internal id;
    bytes internal hashedTitle;
    address internal projectOwner;
    address internal factoryAddress;
    uint256 internal expires;
    uint256 internal backAmount;
    uint256 internal collectedAmount;
    bool internal finished;
    bool public withdrawedByOwner;
    projectStatus public status;

    constructor(
        address _owner,
        uint256 _id,
        string memory _title,
        uint256 _backAmount,
        uint256 _expires,
        string memory tokenName,
        string memory tokenSymbol
    ) {
        bytes memory _hashedTitle = abi.encode(_title);
        projectOwner = _owner;
        id = _id;
        hashedTitle = _hashedTitle;
        expires = _expires;
        backAmount = _backAmount;
        finished = false;
        withdrawedByOwner = false;
        factoryAddress = msg.sender;
        status = projectStatus.UNDEFINED;

        //ERC20 Deploy
        erc20token = new ERC20Token(tokenName, tokenSymbol);

        emit ProjectCreated(id, _title, backAmount, expires);
    }

    //Propably Useless
    modifier isProjectOwner(address sender) {
        _isProjectOwner(sender);
        _;
    }

    function _isProjectOwner(address sender) internal view {
        require(
            sender == projectOwner,
            "ProjectFundRaising: Caller is not the owner"
        );
    }

    modifier projectNotFinished() {
        _projectNotFinished();
        _;
    }

    function _projectNotFinished() internal view {
        require(!finished, "ProjectFundRaising: Project is already finished");
        require(
            expires >= block.timestamp,
            "ProjectFundRaising: Project already expired"
        );
    }

    modifier fundsRaised() {
        _fundsRaised();
        _;
    }

    function _fundsRaised() internal view {
        require(
            collectedAmount >= backAmount,
            "ProjectFundRaising: Funds not raised"
        );
        require(
            finished,
            "ProjectFundRaising: Project is not already finished"
        );
    }

    modifier fundsNotRaised() {
        _fundsNotRaised();
        _;
    }

    function _fundsNotRaised() internal view {
        require(
            backAmount >= collectedAmount,
            "ProjectFundRaising: Funds raised"
        );
    }

    modifier projectExpired() {
        _projectExpired();
        _;
    }

    function _projectExpired() internal view {
        require(
            block.timestamp > expires,
            "ProjectFundRaising: Project not expired yet"
        );
    }

    modifier userBackedProject(address caller) {
        _userBackedProject(caller);
        _;
    }

    function _userBackedProject(address caller) internal view {
        require(
            backers.contains(caller),
            "ProjectFundRaising: User did not back project"
        );
    }

    modifier notWithdrawed() {
        _notWithdrawed();
        _;
    }

    function _notWithdrawed() internal view {
        require(
            !withdrawedByOwner,
            "ProjectFundRaising: Funds already withdrawed"
        );
    }

    modifier onlyFromFactory(address caller) {
        _onlyFromFactory(caller);
        _;
    }

    function _onlyFromFactory(address caller) internal view {
        require(
            caller == factoryAddress,
            "ProjectFundRaising: Function called from not factory it was created"
        );
    }

    modifier projectNotCanceled() {
        _projectNotCanceled();
        _;
    }

    function _projectNotCanceled() internal view {
        require(
            status != projectStatus.CANCELED,
            "ProjectFundRaising: Project is cancelled"
        );
    }

    function backProject()
        external
        payable
        projectNotCanceled
        projectNotFinished
    {
        collectedAmount += msg.value;
        uint256 backValue = 0;

        (bool alreadyBacked, uint256 backedAmountBySender) = backers.tryGet(
            msg.sender
        );

        if (alreadyBacked) {
            backValue = backedAmountBySender + msg.value;
        } else {
            backValue = msg.value;
        }

        backers.set(msg.sender, backValue);

        if (collectedAmount >= backAmount) {
            finished = true;
        }

        //Transfer tokens to backer
        erc20token.mint(msg.sender, msg.value);

        emit ProjectBacked(msg.sender, msg.value);
    }

    //isProjectOwner(msg.sender)
    function ownerWithdrawFunds()
        external
        payable
        override
        projectNotCanceled
        fundsRaised
        isProjectOwner(msg.sender)
        notWithdrawed
    {
        withdrawedByOwner = true;

        payable(projectOwner).transfer(collectedAmount);

        emit FundsWithdrawedByOwner(projectOwner, collectedAmount);
    }

    function backerWithdrawFunds()
        external
        payable
        override
        userBackedProject(msg.sender)
        projectExpired
        fundsNotRaised
    {
        address backer = msg.sender;
        (bool findBacker, uint256 withdrawFund) = backers.tryGet(backer);

        collectedAmount -= withdrawFund;
        backers.set(backer, 0);

        //Burn tokens from backers
        erc20token.burnFrom(backer, withdrawFund);
        payable(backer).transfer(withdrawFund);

        emit FundsWithdrawedByBacker(backer, withdrawFund);
    }

    function cancelProject() external onlyFromFactory(msg.sender) {
        _cancelProject();
    }

    function _cancelProject() internal {
        status = projectStatus.CANCELED;
        finished = true;
        emit ProjectCanceled(id);
    }

    function verifyProject() external onlyFromFactory(msg.sender) {
        _verifyProject();
    }

    function _verifyProject() internal {
        status = projectStatus.VERYFIED;
        emit ProjectVeryfied(id);
    }

    function getId() external view returns (uint256) {
        return id;
    }

    function getTitle() external view returns (string memory) {
        return abi.decode(hashedTitle, (string));
    }

    function getExpiration() external view returns (uint256) {
        return expires;
    }

    function getOwnerOfProject() external view returns (address) {
        return projectOwner;
    }

    function getCollectedAmount() external view returns (uint256) {
        return collectedAmount;
    }

    function getAmountToColect() external view returns (uint256) {
        return backAmount;
    }

    function isFinished() external view returns (bool) {
        return finished;
    }

    function getERC20Address() external view returns (address) {
        return address(erc20token);
    }
}
