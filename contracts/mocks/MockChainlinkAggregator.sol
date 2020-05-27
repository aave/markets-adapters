pragma solidity ^0.6.6;

import "../interfaces/ILatestAnswerGetter.sol";

contract MockChainlinkAggregator is ILatestAnswerGetter {
    int256 immutable LATEST_ANSWER;

    constructor(int256 _latestAnswer) public {
        LATEST_ANSWER = _latestAnswer;
    }

    function latestAnswer() external view override returns (int256) {
        return LATEST_ANSWER;
    }
}
