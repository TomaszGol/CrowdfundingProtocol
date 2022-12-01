//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

library EnumerableMapBytes32ToAddress {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    struct Bytes32ToAddress {
        EnumerableSet.Bytes32Set _keys;
        mapping(bytes32 => address) _values;
    }

    function set(
        Bytes32ToAddress storage map,
        bytes32 key,
        address value
    ) internal returns (bool) {
        map._values[key] = value;
        return map._keys.add(key);
    }

    function remove(
        Bytes32ToAddress storage map,
        bytes32 key
    ) internal returns (bool) {
        delete map._values[key];
        return map._keys.remove(key);
    }

    function contains(
        Bytes32ToAddress storage map,
        bytes32 key
    ) internal view returns (bool) {
        return map._keys.contains(key);
    }

    function length(
        Bytes32ToAddress storage map
    ) internal view returns (uint256) {
        return map._keys.length();
    }

    function at(
        Bytes32ToAddress storage map,
        uint256 index
    ) internal view returns (bytes32, address) {
        bytes32 key = map._keys.at(index);
        return (key, map._values[key]);
    }

    function tryGet(
        Bytes32ToAddress storage map,
        bytes32 key
    ) internal view returns (bool, address) {
        address value = map._values[key];
        if (value == address(0)) {
            return (contains(map, key), address(0));
        } else {
            return (true, value);
        }
    }

    function get(
        Bytes32ToAddress storage map,
        bytes32 key
    ) internal view returns (address) {
        address value = map._values[key];
        require(
            value != address(0) || contains(map, key),
            "EnumerableMap: nonexistent key"
        );
        return value;
    }

    function get(
        Bytes32ToAddress storage map,
        bytes32 key,
        string memory errorMessage
    ) internal view returns (address) {
        address value = map._values[key];
        require(value != address(0) || contains(map, key), errorMessage);
        return value;
    }
}
