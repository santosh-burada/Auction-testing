// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract VikreyAuctionDefinitions{
    
     struct Bid {
        bytes32 bidHash;
        uint256 deposit;
    }

    struct auctions {
        uint256 auction_id;
        address payable beneficiary;
        uint256 biddingEnd;
        uint256 revealEnd;
        bool ended;
        string item_name;
        string item_description;
        bool sold;
        address payable highestBidder;
        uint256 highestBid;
        uint256 secondHighestBid;
        address payable[] revealedBidders;
        address payable winner;
        uint256 winningBid;
        string encryptedKey;
        //address payable secondHighestBidder;
        mapping(address => Bid) bids;
        // Allowed withdrawals of previous bids
        mapping(address => uint256) pendingReturns;
        mapping(address => bool) bidded;
        mapping(address => bool) revealed;
        mapping(address => string) pubkey;
    }

    struct auction_active_listings {
        uint256 auction_id;
        address payable beneficiary;
        uint256 biddingEnd;
        uint256 revealEnd;
        bool ended;
        string item_name;
        string item_description;
        bool bidplaced;
        bool revealed;
    }

    struct auction_all_listings {
        uint256 auction_id;
        address payable beneficiary;
        address payable winner;
        uint256 biddingEnd;
        uint256 revealEnd;
        bool ended;
        bool sold;
        string item_name;
        string item_description;
        bool bidplaced;
        bool revealed;
        uint256 finalBid;
        string pubkey;
        string encryptedKey;
    }

    event AuctionStarted(
        uint256 Auction_id,
        string item_name,
        string item_description
    );

    event AuctionEnded(
        uint256 Auction_id,
        address highestBidder,
        uint256 highestBid
    );

    event ItemUnsold(uint256 auction_id);

    event BiddingStarted(uint256 Auction_id, uint256 bidding_end);

    event BiddingPeriodEnded(uint256 Auction_id);

    event BidMade(address bidder);

    event RevealPeriodStarted(uint256 Auction_id, uint256 reveal_end);

    event RevealPeriodEnded(uint256 Auction_id);

    event WinnerChosen(
        uint256 Auction_id,
        address winner,
        string pubkey,
        uint256 winning_bid
    );

    event BidRevealed(uint256 Auction_id, address bidder);

    event BidRevealFailed(uint256 Auction_id, address bidder);

    event BidderRefunded(uint256 auction_id, address bidder, uint256 bid_value);

    event BalanceRefunded(uint256 auction_id, address bidder, uint256 balance);

    event DepositNotEnough(uint256 auction_id, address bidder);

    event NewHighestBid(uint256 auction_id, address bidder, uint256 bid_value);

    event EncryptedKey(uint256 auction_id, string encryptedKey);

    event deliveryComplete(uint256 auction_id);

    modifier condition(bool _condition) {
        require(_condition);
        _;
    }

    modifier onlyBefore(uint256 _time) {
        // string memory str = "After time" + block.timestamp;
        require(block.timestamp < _time, "After time");
        _;
    }
    modifier onlyAfter(uint256 _time) {
        require(block.timestamp > _time, "before time");
        _;
    }
}