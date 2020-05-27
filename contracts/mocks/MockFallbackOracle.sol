pragma solidity ^0.6.6;

import "../interfaces/IPriceOracleGetter.sol";

contract MockFallbackOracle is IPriceOracleGetter {
    uint256 immutable PRICE;

    constructor(uint256 _price) public {
        PRICE = _price;
    }

    function getAssetPrice(address _asset) external view override returns (uint256) {
        return PRICE;
    }
}
