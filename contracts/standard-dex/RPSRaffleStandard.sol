// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import {IRPSRaffleStandard} from "./IRPSRaffleStandard.sol";
import {Ownable} from "../OZx4/access/Ownable.sol";
import {Pausable} from "../OZx4/security/Pausable.sol";
import "../OZx4/token/ERC20/utils/SafeERC20.sol";

contract RPSSponsoredRaffle is 
    IRPSRaffleStandard, 
    Ownable,
    Pausable
{
    using SafeERC20 for IERC20;

    /* 
        Raffle params
     */
    uint256 public raffleTicketCostUSD;
    uint256 public potLimit;
    uint256 public sponsoredAmount;
    uint16 public currentPotId;
    uint32 public rafflePeriod;
    uint32 public raffleEndTime;
    IERC20 public immutable sponsoredToken;
    uint128 private immutable claimWindow;

    /* 
        Mappings
     */
    mapping(address => Prize) public claimablePrizes;
    mapping(uint256 => RequestStatus) public randomnessRequests;
    mapping(uint16 => uint32) public winningTicketIds; // potId -> winning ticket
    mapping(address => uint256) public pendingAmounts;

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
        VRF
     */
    uint256 public lastRequestId;
    uint256 constant MULTIPLIER = 10000;

    modifier onlyRouter() {
        require(msg.sender == ROUTER, "Unathorized call - not a router");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == OPERATOR, "Caller must be the operator");
        _;
    }

    modifier raffleStarted() {
        require(raffleEndTime > 0, "Raffle hasn't started yet");
        _;
    }

    constructor(
        InitializeParams memory params
    ) {
        require(params.potLimit > 0, "Pot limit must be non-zero");
        require(params.rafflePeriod > 24 hours, "Raffle draw period is too short");
        require(params.claimWindow > 24 hours, "Claim window too short");

        // raffle params
        raffleTicketCostUSD = params.raffleTicketCostUSD;
        rafflePeriod = params.rafflePeriod;
        claimWindow = params.claimWindow;
        sponsoredToken = IERC20(params.sponsoredToken);
        potLimit = params.potLimit;
        
        // ids
        nextPotTicketIdStart = 1; // first ticket of the first pot
        // roles
        ROUTER = params.router;
        OPERATOR = params.operator;

        _transferOwnership(params.owner);
    }

    function startRaffle() external onlyOwner {
        require(raffleEndTime == 0, "You've already started the raffle");
        require(sponsoredAmount >= potLimit, "You must fully sponsor the raffle before starting it");
        raffleEndTime = uint32(block.timestamp) + rafflePeriod;
        emit RaffleStarted(raffleEndTime);
    } 
    
    function executeTrade(
        uint256 _amountInWei, 
        address _user
    ) external onlyRouter whenNotPaused raffleStarted {
        _executeTrade(
            _amountInWei,
            _user
        );

        _checkRaffleFinality();
    }

    function sponsorRaffle(uint256 amount) external {
        require(amount > 0, "The donation must be non-zero");

        sponsoredToken.safeTransferFrom(msg.sender, address(this), amount);
        sponsoredAmount += amount;
    }

    function executeRaffle(
        address winner
    ) external onlyOperator {
        uint _potLimit = potLimit;
        require(sponsoredToken.balanceOf(address(this)) >= _potLimit, 
            "Not enough funds to draw the pot");

        Prize storage userPrize = claimablePrizes[winner];
        userPrize.deadline = uint128(block.timestamp + claimWindow);
        userPrize.amount = userPrize.amount + uint128(_potLimit);

        emit WinnerAssigned(winner);
    }

    function claim() external whenNotPaused {
        address user = msg.sender;
        Prize memory prize = claimablePrizes[user];
        require(prize.amount > 0, "No available winnings");
        require(block.timestamp < prize.deadline, "Claim window is closed");

        claimablePrizes[user].amount = 0; 
        sponsoredToken.safeTransfer(user, prize.amount);

        emit Claim(user, prize.amount);
    }

    function canClaim(address user) external view returns(bool) {
        Prize memory prize = claimablePrizes[user];
        return prize.amount > 0 && block.timestamp < prize.deadline;
    }

    function getWinningTicketIds(uint16 _potId) external view returns(uint32) {
        return winningTicketIds[_potId];
    }

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

    function setPotLimit(uint256 _newPotLimit) external onlyOwner {
        require(_newPotLimit > 0, "Invalid pot limit");
        potLimit = _newPotLimit;
        emit PotLimitUpdated(_newPotLimit);
    }

    function setRafflePeriod(uint32 newPeriod) external onlyOwner {
        require(newPeriod > 24 hours, "Raffle period too short");
        rafflePeriod = newPeriod;
        emit RafflePeriodUpdated(newPeriod);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /* 

            ***
            INTERNAL
            ***
     */

    function _executeTrade(
        uint256 _amountInWei, 
        address _user
    ) internal {
        uint256 _raffleTicketCost = raffleTicketCostUSD;
        uint256 _userPendingAmount = pendingAmounts[_user];
        uint32 tickets = uint32((_userPendingAmount + _amountInWei) / _raffleTicketCost);      

		pendingAmounts[_user] = (_userPendingAmount + _amountInWei) % _raffleTicketCost;
        
        _generateTickets(_user, tickets);
    }
    
    function _generateTickets(
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
            pendingAmounts[_user]
        );
    }

    function _checkRaffleFinality() internal {
        if(block.timestamp >= raffleEndTime && sponsoredAmount >= potLimit) {
            _finishRaffle();
        }
    }

    function _finishRaffle() internal {
        uint32 _lastTicket = lastRaffleTicketId;
        uint32 _nextPotTicketIdStart = nextPotTicketIdStart;

        // Postpone the raffle, because no tickets were generated
        if (_nextPotTicketIdStart > _lastTicket) {
            return;
        }

        potTicketIdEnd = _lastTicket;
        potTicketIdStart = _nextPotTicketIdStart; 
        nextPotTicketIdStart = _lastTicket + 1; // starting ticket of the next Pot

        sponsoredAmount -= potLimit;
        raffleEndTime = uint32(block.timestamp) + rafflePeriod;
        currentPotId++;
        _requestRandomWinners();
    }

    function _requestRandomWinners() internal {
        uint256 id = ++lastRequestId;
        randomnessRequests[id].exists = true;

        emit RandomWordRequested(id, potTicketIdStart, potTicketIdEnd);
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

        uint256 randomWord = _generateRandomFromSalt(salt);
        uint32 winningTicket = _normalizeValueToRange(randomWord, rangeFrom, rangeTo);

        uint16 prevPotId = currentPotId - 1;
        winningTicketIds[prevPotId] = winningTicket;
        emit RandomnessFulfilled(prevPotId, randomWord);
    }

    function _generateRandomFromSalt(uint256 _salt) internal view returns(uint256 _random) {
        return uint256(keccak256(abi.encode(_salt, block.timestamp)));
    }

    function _normalizeValueToRange(
        uint256 _value, uint32 _rangeFrom, uint32 _rangeTo
    ) internal pure returns(uint32 _scaledValue) {
        _scaledValue = uint32(_value) % (_rangeTo - _rangeFrom) + _rangeFrom; // from <= x <= to
    }
}