// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IMatchingEngine {
    function marketBuy(
        address base,
        address quote,
        uint256 quoteAmount,
        bool isMaker,
        uint32 n,
        uint32 uid,
        address maker
    ) external returns (bool clear, uint256);

    function marketSell(
        address base,
        address quote,
        uint256 baseAmount,
        bool isMaker,
        uint32 n,
        uint32 uid,
        address maker
    ) external returns (bool clear, uint256);

    function marketBuyETH(
        address base,
        bool isMaker,
        uint32 n,
        uint32 uid,
        address maker
    ) external payable returns (bool, uint256);

    function marketSellETH(
        address quote,
        bool isMaker,
        uint32 n,
        uint32 uid,
        address maker
    ) external payable returns (bool, uint256);

    function limitBuy(
        address base,
        address quote,
        uint256 price,
        uint256 quoteAmount,
        bool isMaker,
        uint32 n,
        uint32 uid,
        address maker
    ) external returns (bool clear, uint256);

    function limitSell(
        address base,
        address quote,
        uint256 price,
        uint256 baseAmount,
        bool isMaker,
        uint32 n,
        uint32 uid,
        address maker
    ) external returns (bool clear, uint256);

    function limitBuyETH(
        address base,
        uint256 price,
        bool isMaker,
        uint32 n,
        uint32 uid,
        address maker
    ) external payable returns (bool, uint256);

    function limitSellETH(
        address quote,
        uint256 price,
        bool isMaker,
        uint32 n,
        uint32 uid,
        address maker
    ) external payable returns (bool, uint256);
}