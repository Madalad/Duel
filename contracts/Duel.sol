// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.7;

error Duel__InsufficientFunds();

contract Duel is VRFConsumerBaseV2, Ownable {
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    address private immutable i_coordinatorAddress;
    bytes32 private immutable i_keyHash;
    uint64 private immutable i_subscriptionId;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant CALLBACK_GAS_LIMIT = 500000;
    uint32 private constant NUM_WORDS = 1;

    ERC20 public USDC;
    uint256 public entranceFee;
    address[] public entrants;
    uint8 public NUM_PLAYERS = 2;
    uint16 private s_rake;
    address private s_vaultAddress;

    mapping(uint256 => address[]) requestIdToEntrants;

    event RandomWordsRequested(uint256 indexed requestId);
    event Entered(
        uint256 indexed blockNumber,
        address entrant
    );
    event RoundSettled(
        uint256 indexed blockNumber,
        uint256 potAmount,
        address indexed winner
    );

    constructor(
        address _USDCAddress,
        uint256 _entranceFee,
        uint64 _subscriptionId,
        bytes32 _keyHash,
        address _coordinatorAddress,
        uint16 _rake,
        address _vaultAddress
    ) VRFConsumerBaseV2(_coordinatorAddress) {
        USDC = ERC20(_USDCAddress);
        entranceFee = _entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(_coordinatorAddress);
        i_coordinatorAddress = _coordinatorAddress;
        i_subscriptionId = _subscriptionId;
        i_keyHash = _keyHash;
        s_rake = _rake;
        s_vaultAddress = _vaultAddress;
    }

    function enter() external {
        if (USDC.balanceOf(msg.sender) < entranceFee) {
            revert Duel__InsufficientFunds();
        }
        USDC.transferFrom(msg.sender, address(this), entranceFee);
        entrants.push(msg.sender);
        emit Entered(block.number, msg.sender);
        if (entrants.length == NUM_PLAYERS) {
            requestRandomWords();
        }
    }

    function requestRandomWords() public /* internal */
    {
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );
        requestIdToEntrants[requestId] = entrants;
        delete entrants;
        emit RandomWordsRequested(requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        settleRound(requestId, randomWords);
    }

    function settleRound(
        uint256 requestId,
        uint256[] memory randomWords /* internal */
    ) public {
        uint256 indexOfWinner = randomWords[0] % 2;
        address winner = requestIdToEntrants[requestId][indexOfWinner];
        uint256 raked = entranceFee * 2 * s_rake / 10000;
        uint256 potAmount = entranceFee * 2 - raked;
        USDC.transfer(winner, potAmount);
        USDC.transfer(s_vaultAddress, raked);
        emit RoundSettled(block.number, potAmount, winner);
        address[] memory temp;
        requestIdToEntrants[requestId] = temp;
    }

    function getEntranceFee() public view returns (uint256) {
        return entranceFee;
    }

    function getRake() public view returns (uint16) {
        return s_rake;
    }

    function getVaultAddress() public view returns(address) {
        return s_vaultAddress;
    }
    
    function getCoordinatorAddress() external view returns(address) {
        return i_coordinatorAddress;
    }

    function getKeyHash() external view returns(bytes32) {
        return i_keyHash;
    }

    function getSubscriptionId() external view returns(uint256) {
        return i_subscriptionId;
    }

    function getCountEntrants() external view returns(uint256) {
        return entrants.length;
    }

    function setRake(uint16 _newRake) external onlyOwner {
        require(_newRake < 10000, "Cannot set rake to >100%.");
        s_rake = _newRake;
    }
}
