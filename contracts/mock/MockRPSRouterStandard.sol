// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IRPSRaffleStandard} from "../standard-dex/IRPSRaffleStandard.sol";
import {Ownable} from "../OZx4/access/Ownable.sol";
import "../OZx4/token/ERC20/utils/SafeERC20.sol";
import {IMatchingEngine} from "./MatchingEngine.sol";

contract MockRPSRouterStandard is Ownable {
    using SafeERC20 for IERC20;

    IRPSRaffleStandard public raffle;
    IMatchingEngine public matchingEngine;

    constructor(address _owner, address _matchingEngine) {
        matchingEngine = IMatchingEngine(_matchingEngine);
        _transferOwnership(_owner);
    }

    function execute(
        address token,
        uint256 amount,
        address maker
    ) external {
        IMatchingEngine _matchingEngine = matchingEngine;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        // Generating tickets
        raffle.executeTrade(amount, maker, token);

        /* 
            Approve if needed
         */
        if (IERC20(token).allowance(address(_matchingEngine), address(this)) < amount) {
            IERC20(token).safeApprove(address(_matchingEngine), type(uint256).max);
        }
        // Integration call
        _matchingEngine.limitBuy(token, amount, maker);
    }

    function setRaffleAddress(address _raffle) external onlyOwner {
        require(_raffle != address(0), "Zero address");
        require(address(raffle) == address(0), "RPS Raffle address can only be set once");
        raffle = IRPSRaffleStandard(_raffle);
    }
}