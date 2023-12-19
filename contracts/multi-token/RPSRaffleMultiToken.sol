/* 
    TODO [WIP]
 */

// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import {IRPSRaffleMultiToken} from "./IRPSRaffleMultiToken.sol";
import {Ownable} from "../OZx4/access/Ownable.sol";
import {Pausable} from "../OZx4/security/Pausable.sol";
import "../OZx4/token/ERC20/utils/SafeERC20.sol";
import "../OZx4/utils/structs/EnumerableMap.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/Denominations.sol";
import "@chainlink/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol";

contract RPSRaffleMultiToken is 
    IRPSRaffleMultiToken, 
    Ownable,
    Pausable
{
    using SafeERC20 for IERC20;
    using EnumerableMap for EnumerableMap.AddressToUintMap;
    using EnumerableSet for EnumerableSet.AddressSet;
    /* 
        Raffle params
     */
    uint16 public currentPotId;
    uint256 public potLimitUSD; // all USD values are scaled to 10^18
    uint256 public raffleTicketCostUSD;
    uint16 public tradeFeeInBps; // the percent of the swap amount that goes to the pot
    uint16 public protocolFeeInBps; // 100 = 1%, 10000 = 100%;
    uint128 private immutable claimWindow;
    EnumerableSet.AddressSet private approvedTokens;

    /* 
        Mappings
     */
    //mapping(address => AggregatorV3Interface) public chainlinkUSDPair; // token => pair
    mapping(uint16 => EnumerableMap.AddressToUintMap) internal potFunds; // potId => token => balance
    mapping(address => EnumerableMap.AddressToUintMap) internal claimablePrizes; // user -> token -> amount
    mapping(address => uint32) public claimDeadlines; // user -> deadline
    mapping(uint16 => uint32) public winningTicketIds;
    mapping(address => uint256) public pendingAmountsUSD; // user -> value
    EnumerableMap.AddressToUintMap private protocolFeesAccumulated; // token => accumulated fees
    mapping(uint256 => RequestStatus) public randomnessRequests;

    uint256 public lastRequestId;

    /* 
        Ticket data
     */
    uint32 public lastRaffleTicketId;
    uint32 public potTicketIdStart; // start of current pot ticket range
    uint32 public potTicketIdEnd; // end of current pot ticket range
    uint32 public nextPotTicketIdStart;

    /* 
        Roles
     */
    address public immutable ROUTER;
    address public immutable OPERATOR;

    /*
        Misc 
     */
    uint256 constant MULTIPLIER = 10000;
    uint8 constant internal USD_DECIMALS = 8;
    FeedRegistryInterface immutable internal priceFeedRegistry; // TODO remove registry since its only on mainnet. Add price feeds configuration

    modifier onlyRouter() {
        require(msg.sender == ROUTER, "Unathorized call - not a router");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == OPERATOR, "Caller must be the operator");
        _;
    }

    constructor(
        InitializeParams memory params,
        address _priceFeedRegistry
    ) {
        // TODO remove registry and add token configuration
        require(params.tradeFeeInBps < MULTIPLIER, "Incorrect fee value");
        require(params.protocolFeeInBps < MULTIPLIER, "Incorrect fee value");
        require(params.claimWindow > 24 hours, "Claim window too short");
        require(_priceFeedRegistry != address(0), 
            "Specify Chainlink feed registry address");

        // raffle params
        potLimitUSD = params.potLimitUSD;
        raffleTicketCostUSD = params.raffleTicketCostUSD;
        claimWindow = params.claimWindow;
        protocolFeeInBps = params.protocolFeeInBps;
        tradeFeeInBps = params.tradeFeeInBps;
        // ids
        nextPotTicketIdStart = 1; // first ticket of the first pot
        // roles
        ROUTER = params.router;
        OPERATOR = params.operator;

        priceFeedRegistry = FeedRegistryInterface(_priceFeedRegistry);

        _transferOwnership(params.owner);
    }

    function addApprovedToken(
        address token
    ) external onlyOwner { // @audit
        // TODO add swap pool and price feed
        // TODO do we need to add a pool or we can just use a router?
        require(token != address(0), "Zero address");

        bool added = approvedTokens.add(token);
        if (!added) {
            revert("Already approved");
        }

        emit TokenApproved(token);
    } 

    function removeApprovedToken(address token) external onlyOwner { // @audit-ok
        bool removed = approvedTokens.remove(token);
        if (!removed) {
            revert("Token is not approved");
        }
        emit ApprovedTokenRemoved(token);
    }
    
    function executeTrade(
        uint256 inputAmount, 
        address _user,
        address token
    ) external payable onlyRouter whenNotPaused {
        bool isNative = token == address(0);
        if (
            inputAmount == 0 ||
            (isNative && msg.value == 0) ||
            !isApprovedToken(token)
        ) {
            return; // inappropriate cases, but we still want to continue the swap
        }
        
        (
            /* uint80 roundID */,
            int256 answer,
            /* uint256 startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = getLatestRoundForTokenUSDPair(token);
        _validateFeedData(token, answer, updatedAt);

        uint256 tradeAmountUSD = inputAmount * uint256(answer);

        _executeTrade(
            tradeAmountUSD,
            _user,
            raffleTicketCostUSD
        );

        _addProtocolFee(_calculateProtocolFee(inputAmount));
        _addFunds(token, inputAmount);

        uint256 currentPotSizeUSD = _calculatePotSizeUSD(token, answer);
        _checkRaffleFinality(currentPotSizeUSD);
    }

    function executeRaffle(
        address winner
    ) external onlyOperator {
        uint _potLimit = potLimitUSD;

        // TODO set claimablePrizes for the user for each token. Use funds of the previous raffle

        emit WinnerAssigned(winner);
    }

    function claim() external whenNotPaused {
        address payable user = payable(msg.sender);
        // TODO iterate  and transfer all claimable tokens. Might be ether as well
        // TODO emit event for each token
        //emit Claim(user);
    }

    function getWinningTicketIds(uint16 _potId) external view returns(uint32) {
        return winningTicketIds[_potId];
    }

    function isApprovedToken(address token) public view returns(bool) {
        return approvedTokens.contains(token);
    }

    function getLatestRoundForTokenUSDPair(
        address token
    ) public view returns(
        uint80 roundID,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return priceFeedRegistry.latestRoundData(token, Denominations.USD);
    }

    // TODO add claimablePrizes and raffleFunds getters

    /* 

        ***
        SETTERS
        ***

     */

    function setRaffleTicketCost(uint256 _newRaffleTicketCost) external onlyOwner {
        require(raffleTicketCostUSD != _newRaffleTicketCost, "Cost must be different");
        require(_newRaffleTicketCost > 0, "Raffle cost must be non-zero");
        raffleTicketCostUSD = _newRaffleTicketCost;
        emit RaffleTicketCostUpdated(_newRaffleTicketCost);
    }

    function setPotLimit(uint256 _newPotLimit) external onlyOwner { // @audit-ok
        require(potLimitUSD != _newPotLimit, "Pot limit must be different");
        potLimitUSD = _newPotLimit;
        emit PotLimitUpdated(_newPotLimit);
    }

    function setTradeFee(uint16 _newTradeFee) external onlyOwner { // @audit-ok
        require(_newTradeFee < MULTIPLIER, "Fees must be less than 100%");
        tradeFeeInBps = _newTradeFee;
        emit TradeFeeUpdated(_newTradeFee);
    }

    function setProtocolFee(uint16 _newFee) external onlyOwner { // @audit-ok
        require(_newFee < MULTIPLIER, "Fees must be less than 100%");
        protocolFeeInBps = _newFee;
        emit ProtocolFeeUpdated(_newFee);
    }

    function pause() external onlyOwner { // @audit-ok
        _pause();
    }

    function unpause() external onlyOwner { // @audit-ok
        _unpause();
    }

    function withdrawFees(address to) external onlyOwner { // @audit-ok
        require(to != address(0), "Zero address recipient");
        address[] memory tokens = protocolFeesAccumulated.keys();
        uint256 n = tokens.length;
        uint256 _amount;
        address token;

        for(uint i = 0; i < n; i++) {
            token = tokens[i];
            _amount = protocolFeesAccumulated.get(token);
            if (_amount > 0) {
                protocolFeesAccumulated.set(token, 0);
                IERC20(token).safeTransfer(to, _amount);
            }
        }
    }

    /* 

            ***
            INTERNAL
            ***
     */

    function _executeTrade(
        uint256 usdTradeAmount, 
        address _user, 
        uint256 _raffleTicketCostUSD
    ) internal { // @audit-ok
        uint256 _userPendingAmount = pendingAmountsUSD[_user];
        uint32 tickets = uint32((_userPendingAmount + usdTradeAmount) / _raffleTicketCostUSD);      

		pendingAmountsUSD[_user] = (_userPendingAmount + usdTradeAmount) % _raffleTicketCostUSD;
        
        _generateTickets(_user, tickets);
    }

    function _addFunds(
        address token, 
        uint256 tokenAmount
    ) internal {
        EnumerableMap.AddressToUintMap storage funds = potFunds[currentPotId];
        (bool exists, uint256 tokenFunds) = funds.tryGet(token);

        if (exists) {
            funds.set(token, tokenFunds + tokenAmount);
        }
        else {
            funds.set(token, tokenAmount);
        }
    }

    function _addProtocolFee(uint256 feeDelta) internal {
        // TODO accumulate protocol fee
    }
    
    function _generateTickets( // @audit-ok
        address _user,
        uint32 tickets 
    ) internal {
        uint32 ticketIdStart = 0;
        uint32 ticketIdEnd = 0;

        /*
            Assigning newly generated ticket ranges 
        */
        if (tickets == 0) {
            return;
        }
       
        ticketIdStart = lastRaffleTicketId + 1;
        ticketIdEnd = ticketIdStart + tickets - 1; 

        lastRaffleTicketId += tickets;

        emit GenerateRaffleTickets(
            _user, 
            ticketIdStart, 
            ticketIdEnd,
            pendingAmountsUSD[_user]
        );
    }

    function _calculatePotDeltaUSD(
        uint256 tradeAmountUSD
    ) internal view returns(uint256) {
        return tradeAmountUSD * tradeFeeInBps * 
            (MULTIPLIER - protocolFeeInBps) / MULTIPLIER^2;            
    }

    function _calculateProtocolFee(uint256 inputTokenAmount) internal view returns(uint256) {
        return inputTokenAmount * protocolFeeInBps / MULTIPLIER;
    }

    function _checkRaffleFinality(uint256 currentPotSizeUSD) internal {
        if(currentPotSizeUSD >= potLimitUSD) {
            _finishRaffle();
        }
    }

    /* 
       * @notice Returns the funds value of the current pot,
       * denominated in USD
       * 
       * @dev USD value is scaled to 10^8.
     */
    function _calculatePotSizeUSD(
        address inputToken,
        int256 inputTokenPriceToUSD
    ) internal returns(uint256 currentPotSizeUSD) {
        EnumerableMap.AddressToUintMap storage currentPotFunds = potFunds[currentPotId];
        address[] memory raffleFundTokens = currentPotFunds.keys();
        uint256 n_tokens = raffleFundTokens.length;
        
        for(uint256 i = 0; i < n_tokens; i++) {
            address token = raffleFundTokens[i];
            uint256 token_amount = currentPotFunds.get(token);
            
            if (token_amount == 0) {
                continue;
            }

            int256 answer;
            if (token == inputToken) {
                answer = inputTokenPriceToUSD;
            }
            else {
                uint256 updatedAt;
                (
                    /* uint80 roundID */,
                    answer,
                    /* uint256 startedAt */,
                    updatedAt,
                    /* uint80 answeredInRound */
                ) = getLatestRoundForTokenUSDPair(token);
                _validateFeedData(token, answer, updatedAt);
            }

            currentPotSizeUSD += token_amount * uint256(answer);
        }
    }

    function _validateFeedData(
        address token,
        int256 answer,
        uint256 updatedAt
    ) internal { // @audit

        // TODO volatility validation
        // TODO timestamp validation
    }

    function _finishRaffle() internal {
        uint32 _lastTicket = lastRaffleTicketId;
        potTicketIdEnd = _lastTicket;
        potTicketIdStart = nextPotTicketIdStart; 
        nextPotTicketIdStart = _lastTicket + 1; // starting ticket of the next Pot
        currentPotId++;
        _requestRandomWinners();
    }

    function _requestRandomWinners() internal {
        uint256 id = ++lastRequestId;
        randomnessRequests[id].exists = true;

        emit RandomWordRequested(
            id, 
            potTicketIdStart, 
            potTicketIdEnd, 
            currentPotId - 1
        );
    }

    function fulfillRandomWords(
        uint256 salt
    ) external onlyOperator {
        uint256 _lastRequestId = lastRequestId;
        RequestStatus memory lastRequest = randomnessRequests[_lastRequestId];

        require(lastRequest.exists && !lastRequest.fullfilled, 
            "Cannot fulfill - invalid request status");

        uint32 rangeFrom = potTicketIdStart;
        uint32 rangeTo = potTicketIdEnd;

        randomnessRequests[_lastRequestId] = RequestStatus({
            fullfilled: true,
            exists: true,
            randomWord: salt
        });

        // TODO random number from salt
        uint256 randomWord; 
        uint32 winningTicket = _normalizeValueToRange(randomWord, rangeFrom, rangeTo);

        uint16 prevPotId = currentPotId - 1;
        winningTicketIds[prevPotId] = winningTicket;
        emit RandomnessFulfilled(prevPotId, randomWord);
    }

    function _normalizeValueToRange(
        uint256 _value, uint32 _rangeFrom, uint32 _rangeTo
    ) internal pure returns(uint32 _scaledValue) {
        _scaledValue = uint32(_value) % (_rangeTo - _rangeFrom) + _rangeFrom; // from <= x <= to
    }

    function _incrementRandomValueUntilUnique(
        uint32 _random, 
        uint32[] memory _randomWords, 
        uint32 _rangeFrom,
        uint32 _rangeTo
    ) internal pure returns(uint32 _uniqueRandom) {
        _uniqueRandom = _random;
        for(uint i = 0; i < _randomWords.length;) {
            if(_uniqueRandom == _randomWords[i]) {
                unchecked {
                    _uniqueRandom = _normalizeValueToRange(
                        _uniqueRandom + 1,
                        _rangeFrom,
                        _rangeTo
                    );
                    i = 0;
                }
            }
            else {
                unchecked {
                    i++;
                }
            }
        }
    }
}