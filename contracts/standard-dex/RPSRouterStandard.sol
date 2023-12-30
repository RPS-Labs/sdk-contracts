// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IRPSRaffleStandard} from "../standard-dex/IRPSRaffleStandard.sol";
import {Ownable} from "../OZx4/access/Ownable.sol";
import "../OZx4/token/ERC20/utils/SafeERC20.sol";
import {IMatchingEngine} from "./IMatchingEngine.sol";

contract RPSRouterStandard is Ownable {
    using SafeERC20 for IERC20;

    IRPSRaffleStandard public raffle;
    IMatchingEngine public matchingEngine;

    address constant private NATIVE = address(0);

    constructor(address _owner, address _matchingEngine) {
        matchingEngine = IMatchingEngine(_matchingEngine);
        _transferOwnership(_owner);
    }

    function marketBuy(
        address base,
        address quote,
        uint256 quoteAmount,
        bool isMaker,
        uint32 n,
        uint32 uid
    ) external returns(bool clear) {
        _depositAndApprove(quote, quoteAmount);

        // Place order
        uint256 matchedAmount;
        (clear, matchedAmount) = matchingEngine.marketBuy(
            base,
            quote,
            quoteAmount,
            isMaker,
            n,
            uid,
            msg.sender
        );

        if (matchedAmount > 0) {
            raffle.executeTrade(matchedAmount, msg.sender, quote);
        }
    }

    function marketSell(
        address base,
        address quote,
        uint256 baseAmount,
        bool isMaker,
        uint32 n,
        uint32 uid
    ) external returns(bool clear) {
        _depositAndApprove(base, baseAmount);

        // Place order
        uint256 matchedAmount;
        (clear, matchedAmount) = matchingEngine.marketSell(
            base,
            quote,
            baseAmount,
            isMaker,
            n,
            uid,
            msg.sender
        );

        if (matchedAmount > 0) {
            raffle.executeTrade(matchedAmount, msg.sender, base);
        }
    }

    function marketBuyETH(
        address base,
        bool isMaker,
        uint32 n,
        uint32 uid
    ) external payable returns(bool clear) {
        // Place order
        uint256 matchedAmount;
        (clear, matchedAmount) = matchingEngine.marketBuyETH{value: msg.value}(
            base,
            isMaker,
            n,
            uid,
            msg.sender
        );

        if (matchedAmount > 0) {
            raffle.executeTrade(matchedAmount, msg.sender, NATIVE);
        }
    }

    function marketSellETH(
        address quote,
        bool isMaker,
        uint32 n,
        uint32 uid
    ) external payable returns (bool clear) {
        // Place order
        uint256 matchedAmount;
        (clear, matchedAmount) = matchingEngine.marketSellETH{value: msg.value}(
            quote,
            isMaker,
            n,
            uid,
            msg.sender
        );

        if (matchedAmount > 0) {
            raffle.executeTrade(matchedAmount, msg.sender, NATIVE);
        }
    }

    function limitBuy(
        address base,
        address quote,
        uint256 price,
        uint256 quoteAmount,
        bool isMaker,
        uint32 n,
        uint32 uid
    ) external returns (bool clear) {
        _depositAndApprove(quote, quoteAmount);

        // Place order
        uint256 matchedAmount;
        (clear, matchedAmount) = matchingEngine.limitBuy(
            base,
            quote,
            price,
            quoteAmount,
            isMaker,
            n,
            uid,
            msg.sender
        );

        if (matchedAmount > 0) {
            raffle.executeTrade(matchedAmount, msg.sender, quote);
        }
    }

    function limitSell(
        address base,
        address quote,
        uint256 price,
        uint256 baseAmount,
        bool isMaker,
        uint32 n,
        uint32 uid
    ) external returns (bool clear) {
        _depositAndApprove(base, baseAmount);

        // Place order
        uint256 matchedAmount;
        (clear, matchedAmount) = matchingEngine.limitSell(
            base,
            quote,
            price,
            baseAmount,
            isMaker,
            n,
            uid,
            msg.sender
        );

        if (matchedAmount > 0) {
            raffle.executeTrade(matchedAmount, msg.sender, base);
        }
    }

    function limitBuyETH(
        address base,
        uint256 price,
        bool isMaker,
        uint32 n,
        uint32 uid
    ) external payable returns (bool clear) {
        // Place order
        uint256 matchedAmount;
        (clear, matchedAmount) = matchingEngine.limitBuyETH{value: msg.value}(
            base,
            price,
            isMaker,
            n,
            uid,
            msg.sender
        );

        if (matchedAmount > 0) {
            raffle.executeTrade(matchedAmount, msg.sender, NATIVE);
        }
    }

    function limitSellETH(
        address quote,
        uint256 price,
        bool isMaker,
        uint32 n,
        uint32 uid
    ) external payable returns (bool clear) {
        // Place order
        uint256 matchedAmount;
        (clear, matchedAmount) = matchingEngine.limitSellETH{value: msg.value}(
            quote,
            price,
            isMaker,
            n,
            uid,
            msg.sender
        );

        if (matchedAmount > 0) {
            raffle.executeTrade(matchedAmount, msg.sender, NATIVE);
        }
    }

    function setRaffleAddress(address _raffle) external onlyOwner {
        require(_raffle != address(0), "Zero address");
        require(address(raffle) == address(0), "RPS Raffle address can only be set once");
        raffle = IRPSRaffleStandard(_raffle);
    }

    function _depositAndApprove(
        address asset,
        uint256 inputAmount
    ) internal {
        address _matchingEngine = address(matchingEngine);
        IERC20(asset).safeTransferFrom(msg.sender, address(this), inputAmount);

        // Approve if needed
        if (IERC20(asset).allowance(
            _matchingEngine, address(this)) < inputAmount
        ) {
            IERC20(asset).safeApprove(_matchingEngine, type(uint256).max);
        }
    }
}