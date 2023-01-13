//SPDX-License-Identifier: Business Source License 1.1

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../libraries/EnumerableMapBytes32ToAddress.sol";

contract TestEnumerableMap {
    using EnumerableMapBytes32ToAddress for EnumerableMapBytes32ToAddress.Bytes32ToAddress;

    EnumerableMapBytes32ToAddress.Bytes32ToAddress internal map;

    constructor() {}

    function set(bytes32 key, address value) public returns (bool) {
        return map.set(key, value);
    }

    function remove(bytes32 key) public returns (bool) {
        return map.remove(key);
    }

    function contains(bytes32 key) public view returns (bool) {
        return map.contains(key);
    }

    function length() public view returns (uint256) {
        return map.length();
    }

    function at(uint256 index) public view returns (bytes32, address) {
        return map.at(index);
    }

    function tryGet(bytes32 key) public view returns (bool, address) {
        return map.tryGet(key);
    }

    function get(bytes32 key) public view returns (address) {
        return map.get(key);
    }

    function getWithError(
        bytes32 key,
        string memory errorMessage
    ) public view returns (address) {
        return map.get(key, errorMessage);
    }
}
