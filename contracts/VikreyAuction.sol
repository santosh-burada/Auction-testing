/// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import './VikreyAuctionDefinitions.sol';

contract VikreyAuction is VikreyAuctionDefinitions{

   

    mapping(uint256 => auctions) private Auctions;

    uint256 current_auction_id = 0;
    uint256 activeauctions = 0;

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

    //functions
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
        Auctions[auction_id].highestBidder = payable(address(0));
        Auctions[auction_id].highestBid = 0;
        Auctions[auction_id].secondHighestBid = 0;
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
            if (currentauction.highestBidder != address(0))
                pubkey = currentauction.pubkey[currentauction.highestBidder];
            all_auctions[i] = auction_all_listings(
                currentauction.auction_id,
                currentauction.beneficiary,
                currentauction.highestBidder,
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
        onlyBefore(Auctions[auction_id].biddingEnd)
        validBidder(auction_id)
        newBidder(auction_id)
        validAuctionId(auction_id)
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
        if (value <= Auctions[auction_id].secondHighestBid) {
            return false;
        } else if (
            value > Auctions[auction_id].secondHighestBid &&
            value <= Auctions[auction_id].highestBid
        ) {

            Auctions[auction_id].secondHighestBid = value;
            return false;
            //  Auctions[auction_id].secondHighestBidder = bidder;
        } else if (value > Auctions[auction_id].highestBid) {
          
            Auctions[auction_id].secondHighestBid = Auctions[auction_id]
                .highestBid;
            Auctions[auction_id].highestBid = value;
            Auctions[auction_id].pendingReturns[
                Auctions[auction_id].highestBidder
            ] += 2 * Auctions[auction_id].secondHighestBid;

            Auctions[auction_id].highestBidder = bidder;
            return true;

        }

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
        onlyAfter(Auctions[auction_id].revealEnd)
        onlyBeneficiary(auction_id)
        auctionActive(auction_id)
        validAuctionId(auction_id)
    {

        if (
            Auctions[auction_id].highestBidder == address(0) &&
            Auctions[auction_id].highestBid == 0
        ) {
            emit ItemUnsold(auction_id);
            emit AuctionEnded(auction_id, address(0), 0);
            Auctions[auction_id].ended = true;
            activeauctions -= 1;
        } else if (

            Auctions[auction_id].secondHighestBid == 0
        ) {
            emit AuctionEnded(
                auction_id,
                Auctions[auction_id].highestBidder,
                Auctions[auction_id].highestBid
            );
            Auctions[auction_id].winner = Auctions[auction_id].highestBidder;
            Auctions[auction_id].winningBid = Auctions[auction_id].highestBid;
            Auctions[auction_id].ended = true;
            activeauctions -= 1;

            emit WinnerChosen(
                auction_id,
                Auctions[auction_id].highestBidder,
                Auctions[auction_id].pubkey[Auctions[auction_id].winner],
                Auctions[auction_id].winningBid
            );
        } else {
            emit AuctionEnded(
                auction_id,
                Auctions[auction_id].highestBidder,
                Auctions[auction_id].secondHighestBid
            );
            Auctions[auction_id].winner = Auctions[auction_id].highestBidder;
            Auctions[auction_id].winningBid = Auctions[auction_id]
                .secondHighestBid;
            Auctions[auction_id].ended = true;
            activeauctions -= 1;
            uint256 difference = 2 *
                (Auctions[auction_id].highestBid -
                    Auctions[auction_id].secondHighestBid);
            Auctions[auction_id].pendingReturns[
                Auctions[auction_id].highestBidder
            ] += difference;
            //highest.transfer(Auctions[auction_id].highestBid);
            for (
                uint256 i = 0;
                i < Auctions[auction_id].revealedBidders.length;
                ++i
            ) {
                withdraw(auction_id, Auctions[auction_id].revealedBidders[i]);
            }

            emit WinnerChosen(
                auction_id,
                Auctions[auction_id].winner,
                Auctions[auction_id].pubkey[Auctions[auction_id].winner],
                Auctions[auction_id].winningBid
            );
        }
    }

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
