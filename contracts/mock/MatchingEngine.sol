pragma solidity 0.8.19;

import "../OZx4/token/ERC20/utils/SafeERC20.sol";

interface IMatchingEngine {
    function limitBuy(
        address token,
        uint256 amount,
        address maker
    ) external payable;
}

contract MatchingEngine is IMatchingEngine {
    using SafeERC20 for IERC20;
    address public lastMaker;

    function limitBuy(
        address token,
        uint256 amount,
        address maker
    ) external payable {
        if (token != address(0)) {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }
        else {
            require(msg.value >= amount, "Insufficient funds");
        }
        lastMaker = maker;
    }
}