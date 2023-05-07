/// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

import './AverageAuctionDefinitions.sol';

contract AveragePriceAuction is AverageAuctionDefinitions {

    

    mapping(uint256 => auctions) private Auctions;

    // variables for managing auctions
    uint256 current_auction_id = 0;
    uint256 activeauctions = 0;


    modifier condition(bool _condition) {
        require(_condition);
        _;
    }

    modifier onlyBefore(uint256 _time) {
        require(block.timestamp < _time, "After time");
        _;
    }
    modifier onlyAfter(uint256 _time) {
        require(block.timestamp > _time, "before time");
        _;
    }

    modifier validBidder(uint256 auction_id) {
        require(
            msg.sender != Auctions[auction_id].beneficiary,
            "Beneficiary cannot bid"
        );
        _;
    }
    modifier newBidder(uint256 auction_id) {
        require(
            !Auctions[auction_id].bidded[msg.sender],
            "Bidder Already placed their bid"
        );
        _;
    }

    modifier alreadyBidder(uint256 auction_id) {
        require(
            Auctions[auction_id].bidded[msg.sender] == true,
            "Didn't place a bet,no point in revealing the bid"
        );
        _;
    }

    modifier onlyBeneficiary(uint256 auction_id) {
        require(
            Auctions[auction_id].beneficiary == msg.sender,
            "Only Beneficiary can end the auction"
        );
        _;
    }
    modifier auctionActive(uint256 auction_id) {
        require(Auctions[auction_id].ended == false, "Auction already ended");
        _;
    }
    modifier auctionEnded(uint256 auction_id) {
        require(
            Auctions[auction_id].ended == true,
            "Cant Ask refund,auction not ended"
        );
        _;
    }
    modifier validAuctionId(uint256 auction_id) {
        require(
            auction_id < current_auction_id,
            "Auction Id provided doesn't exist"
        );
        _;
    }
    modifier onlyWinner(uint256 auction_id) {
        require(
            msg.sender == Auctions[auction_id].winner,
            "Only Winner can confirm purchase"
        );
        _;
    }

    function getAccountBalance(address account)
        public
        view
        returns (uint256 accountBalance)
    {
        accountBalance = account.balance;
    }

    function auctionItem(
        string calldata item_name,
        string calldata item_description,
        uint256 bidding_time,
        uint256 reveal_time
    ) external payable {
        uint256 auction_id = current_auction_id;
        current_auction_id += 1;
        activeauctions += 1;
        uint256 bidding_end = block.timestamp + bidding_time;
        uint256 reveal_end = bidding_end + reveal_time;

        Auctions[auction_id].auction_id = auction_id;
        Auctions[auction_id].beneficiary = payable(msg.sender);
        Auctions[auction_id].biddingEnd = bidding_end;
        Auctions[auction_id].revealEnd = reveal_end;
        Auctions[auction_id].ended = false;
        Auctions[auction_id].item_name = item_name;
        Auctions[auction_id].item_description = item_description;
        Auctions[auction_id].sold = false;
        Auctions[auction_id].sum = 0;
        Auctions[auction_id].no_of_bids = 0;
        Auctions[auction_id].revealedBidders = new address payable[](0);
        Auctions[auction_id].winner = payable(address(0));
        Auctions[auction_id].winningBid = 0;
        Auctions[auction_id].encryptedKey = "";
        emit AuctionStarted(auction_id, item_name, item_description);
        emit BiddingStarted(auction_id, bidding_end);
    }

    function getactiveauctions()
        external
        view
        returns (auction_active_listings[] memory)
    {
        uint256 currentIndex = 0;
        auction_active_listings[]
            memory active_auctions = new auction_active_listings[](
                activeauctions
            );
        for (uint256 i = 0; i < current_auction_id; i++) {
            if (Auctions[i].ended == false) {
                auctions storage currentauction = Auctions[i];
                active_auctions[currentIndex] = auction_active_listings(
                    currentauction.auction_id,
                    currentauction.beneficiary,
                    currentauction.biddingEnd,
                    currentauction.revealEnd,
                    currentauction.ended,
                    currentauction.item_name,
                    currentauction.item_description,
                    currentauction.bidded[msg.sender],
                    currentauction.revealed[msg.sender]
                );
                currentIndex += 1;
            }
        }
        return active_auctions;
    }

    function getallauctions()
        external
        view
        returns (auction_all_listings[] memory)
    {
        auction_all_listings[] memory all_auctions = new auction_all_listings[](
            current_auction_id
        );
        for (uint256 i = 0; i < current_auction_id; i++) {
            auctions storage currentauction = Auctions[i];
            string memory pubkey = "";
            if (currentauction.winner != address(0))
                pubkey = currentauction.pubkey[currentauction.winner];
            all_auctions[i] = auction_all_listings(
                currentauction.auction_id,
                currentauction.beneficiary,
                currentauction.winner,
                currentauction.biddingEnd,
                currentauction.revealEnd,
                currentauction.ended,
                currentauction.sold,
                currentauction.item_name,
                currentauction.item_description,
                currentauction.bidded[msg.sender],
                currentauction.revealed[msg.sender],
                currentauction.winningBid,
                pubkey,
                currentauction.encryptedKey
            );
        }
        return all_auctions;
    }

    function bid(
        bytes32 blindedBid,
        uint256 auction_id,
        string calldata pubkey
    )
        external
        payable
        validAuctionId(auction_id)
        onlyBefore(Auctions[auction_id].biddingEnd)
        validBidder(auction_id)
        newBidder(auction_id)
    {
        Auctions[auction_id].bids[msg.sender] = Bid(blindedBid, msg.value);
        Auctions[auction_id].bidded[msg.sender] = true;
        Auctions[auction_id].pubkey[msg.sender] = pubkey;
        emit BidMade(msg.sender);
    }

    function reveal(
        uint256 value,
        //bool fake,
        string calldata secret,
        uint256 auction_id
    )
        external
        payable
        onlyAfter(Auctions[auction_id].biddingEnd)
        onlyBefore(Auctions[auction_id].revealEnd)
        alreadyBidder(auction_id)
        validAuctionId(auction_id)
    {
        uint256 refund = 0;
        //get the bid placed by the user
        Bid storage bidToCheck = Auctions[auction_id].bids[msg.sender];

        // improper revealing
        if (bidToCheck.bidHash != keccak256(abi.encode(value, secret))) {
            // Bid was not actually revealed.
            // Do not refund deposit.
            emit BidRevealFailed(auction_id, msg.sender);
        } else {
            // Make it impossible for the sender to re-claim
            bidToCheck.bidHash = bytes32(0);

            uint revealedBiddersLength = Auctions[auction_id].revealedBidders.length;
            Auctions[auction_id].revealedBidders[revealedBiddersLength] = payable(msg.sender);
            Auctions[auction_id].revealed[msg.sender] = true;
            refund += bidToCheck.deposit;
            if (bidToCheck.deposit >= 2 * value) {
                if (placeBid(auction_id, payable(msg.sender), value))
                    refund -= 2 * value;
                emit BidRevealed(auction_id, msg.sender);
            } else emit DepositNotEnough(auction_id, msg.sender);
            // the same deposit.
            emit BalanceRefunded(auction_id, msg.sender, refund);
            payable(msg.sender).transfer(refund);
        }
    }

    function placeBid(
        uint256 auction_id,
        address payable bidder,
        uint256 value
    ) internal returns (bool success) {
        Auctions[auction_id].bidders[Auctions[auction_id].no_of_bids] = bidder;
        Auctions[auction_id].no_of_bids += 1;
        Auctions[auction_id].sum += value;
        Auctions[auction_id].pendingReturns[bidder] += 2 * value;
        return true;
    }

    function withdraw(uint256 auction_id, address payable bidder)
        internal
        auctionEnded(auction_id)
    {
        //emit BidderRefunded(auction_id,msg.sender, Auctions[auction_id].pendingReturns[msg.sender]);
        if (Auctions[auction_id].pendingReturns[bidder] > 0) {
            uint256 value = Auctions[auction_id].pendingReturns[bidder];
            Auctions[auction_id].pendingReturns[bidder] = 0;
            address payable payable_sender = bidder;
            payable_sender.transfer(value);
            emit BidderRefunded(auction_id, bidder, value);
        }
    }


    function auctionEnd(uint256 auction_id)
        external
        validAuctionId(auction_id)
        onlyAfter(Auctions[auction_id].revealEnd)
        onlyBeneficiary(auction_id)
        auctionActive(auction_id)
    {
        if (Auctions[auction_id].no_of_bids == 0) {
            emit ItemUnsold(auction_id);
            Auctions[auction_id].ended = true;
            activeauctions -= 1;
        } else {
            int256 closest_difference = 100000000000000000000000;
            address payable winner = payable(address(0));
            uint256 winning_bid = 0;
            for (uint256 i = 0; i < Auctions[auction_id].no_of_bids; i++) {
                address payable bidder_address = Auctions[auction_id].bidders[
                    i
                ];
                uint256 bid_value = Auctions[auction_id].pendingReturns[
                    bidder_address
                ] / 2;
                int256 difference = int256(Auctions[auction_id].sum) -
                    (int256(bid_value) *
                        int256(Auctions[auction_id].no_of_bids));
                // if (difference < 0) {
                //     difference = -difference;
                // }
                difference = difference >= 0 ? difference : -difference;
                if (difference < closest_difference) {
                    closest_difference = difference;
                    winner = bidder_address;
                    winning_bid = bid_value;
                }
            }
            Auctions[auction_id].pendingReturns[winner] = 0;
            Auctions[auction_id].ended = true;
            Auctions[auction_id].winner = winner;
            Auctions[auction_id].winningBid = winning_bid;
            activeauctions -= 1;
            for (
                uint256 i = 0;
                i < Auctions[auction_id].revealedBidders.length;
                ++i
            ) {
                if (
                    Auctions[auction_id].revealedBidders[i] !=
                    Auctions[auction_id].winner
                ) withdraw(auction_id, Auctions[auction_id].revealedBidders[i]);
            }
            //Auctions[auction_id].beneficiary.transfer(winning_bid);
            string storage winner_pubkey = Auctions[auction_id].pubkey[winner];
            winning_bid = Auctions[auction_id].winningBid;
            emit WinnerChosen(auction_id, winner, winner_pubkey, winning_bid);
        }
    }

    /// @dev Sale of item from seller's side
    /// @dev Transaction from the seller
    /// @param auction_id is the id of the item being sold_
    /// @param encryptedKey is the unique string for the item
    /// @dev assume the seller is fair,will provide the right item
    function sellItem(uint256 auction_id, string calldata encryptedKey)
        external
        payable
        validAuctionId(auction_id)
        auctionEnded(auction_id)
        onlyBeneficiary(auction_id)
    {
        require(
            msg.value == 2 * Auctions[auction_id].winningBid,
            "You have not paid right the security deposit"
        );
        Auctions[auction_id].encryptedKey = encryptedKey;

        emit EncryptedKey(auction_id, encryptedKey);
        //  Auctions[auction_id].beneficiary.transfer(Auctions[auction_id].winningBid);
    }

    /// @dev Confirmation of delivery
    /// @dev Transaction from the winner
    /// @param auction_id is the id of the item being sold_
    function confirmDelivery(uint256 auction_id)
        external
        payable
        validAuctionId(auction_id)
        onlyWinner(auction_id)
        auctionEnded(auction_id)
    {
        /// Refund the seller
        uint256 amt = Auctions[auction_id].winningBid;
        uint256 prof = 3 * amt;
        // emit deliveryComplete(auction_id);
        Auctions[auction_id].pendingReturns[Auctions[auction_id].winner] = 0;
        Auctions[auction_id].sold = true;

        Auctions[auction_id].beneficiary.transfer(prof);
        Auctions[auction_id].winner.transfer(amt);

        emit deliveryComplete(auction_id);
    }
}
