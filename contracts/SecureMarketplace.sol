// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

import "./ListingBase.sol";

contract SecureMarketplace is ListingBase {

    mapping(uint256 => Listing) private listings;

    modifier validBuyer(uint256 id) {
        require(
            listings[id].beneficiary != msg.sender,
            "Invalid Buyer"
        );
        _;
    }

    modifier validBeneficiary(uint256 id) {
        require(
            listings[id].buyer != msg.sender,
            "Invalid beneficiary"
        );
        _;
    }

    modifier checkState(uint256 id) {
        require(
            !listings[id].sold_or_withdrawn,
            "Item has already been bought / withdrawn"
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

    function createListings(
        uint256 price,
        string calldata item_name,
        string calldata item_description
    ) external payable condition(price > 0) {
    uint256 id = currentListingId;
    currentListingId += 1;
    activeListings += 1;
        listings[id] = Listing(
        id,
        payable(msg.sender),
        payable(address(0)),
        price,
        item_name,
        item_description,
        false,
        false,
        "",
        "",
        State.Active
    );

    emit ListingCreated(
        id,
        msg.sender,
        price,
        item_name,
        item_description
    );
    emit ListingChanged(msg.sender, activeListings);
    }

function fetchActiveListings() external view returns (Listing[] memory) {
    uint256 currentIndex = 0;

    Listing[] memory activeList = new Listing[](activeListings);
    for (uint256 i = 0; i < currentListingId; i++) {
        if (listings[i].sold_or_withdrawn == false) {
            Listing storage currentListing = listings[i];
            activeList[currentIndex] = currentListing;
            currentIndex += 1;
        }
    }
    return activeList;
}

function fetchAllListings() external view returns (Listing[] memory) {
    uint256 currentIndex = 0;

    Listing[] memory allListings = new Listing[](currentListingId);
    for (uint256 i = 0; i < currentListingId; i++) {
        Listing storage currentListing = listings[i];
        allListings[currentIndex] = currentListing;
        currentIndex += 1;
    }
    return allListings;
}

function requestBuy(uint256 id, string calldata publicKey)
    external
    payable
    validBuyer(id)
    validListing(id)
    checkState(id)
{
    require(
        !listings[id].buyerAssigned,
        "the item already has a buyer, in midst of transaction"
    );

    require(
        msg.sender.balance >= listings[id].price,
        "Insufficient Balance for transaction"
    );

    require(
        msg.value == 2 * listings[id].price,
        "The required deposit for the purchase not given"
    );

    listings[id].buyer = payable(msg.sender);
    listings[id].buyerAssigned = true;
    listings[id].publicKey = publicKey;
    emit PurchaseRequested(listings[id], msg.sender, publicKey);
}

function sellItem(uint256 id, string calldata encryptedKey)
    external
    payable
    validListing(id)
    validBeneficiary(id)
    checkState(id)
{
    require(
        msg.value == 2 * listings[id].price,
        "You have not paid the security deposit"
    );
    listings[id].state = State.Sold;
    listings[id].encryptedKey = encryptedKey;

    emit EncryptedKey(id, encryptedKey);
}

function confirmDelivery(uint256 id)
    external
    payable
    validListing(id)
    validBuyer(id)
    checkState(id)
{
    listings[id].sold_or_withdrawn = true;
    listings[id].beneficiary.transfer(
        3 * listings[id].price
    );
    listings[id].buyer.transfer(listings[id].price);
    activeListings -= 1;
    listings[id].state = State.Delivered;
    emit ListingChanged(listings[id].beneficiary, id);
    emit PurchaseComplete(listings[id]);
}
function abort(uint256 auction_id) public checkState(auction_id) {
        emit Aborted();
        listings[auction_id].state = State.Inactive;
        activeListings -= 1;
        listings[auction_id].beneficiary.transfer(address(this).balance);
    }
    
}
