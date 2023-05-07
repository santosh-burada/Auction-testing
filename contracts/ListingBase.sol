// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract ListingBase {
    uint256 currentListingId = 0;
    uint256 public activeListings = 0;

    struct Bid {
        bytes32 bidHash;
        uint256 bidAmount;
    }

    struct Listing {
        uint256 id;
        address payable beneficiary;
        address payable buyer;
        uint256 price;
        string item_name;
        string item_description;
        bool sold_or_withdrawn;
        bool buyerAssigned;
        string publicKey;
        string encryptedKey;
        State state;
    }

    enum State {
        Created,
        Active,
        Sold,
        Delivered,
        Inactive
    }
    State public state;

    event ListingCreated(
        uint256 indexed id,
        address beneficiary,
        uint256 price,
        string item_name,
        string item_description
    );
    event ListingChanged(address indexed beneficiary, uint256 indexed index);
    event PurchaseRequested(
        Listing list,
        address indexed buyer,
        string pubKey
    );
    event EncryptedKey(uint256 indexed id, string encryptedKey);
    event PurchaseComplete(Listing list);
    event Aborted();

    modifier condition(bool _condition) {
        require(_condition);
        _;
    }



    modifier validListing(uint256 id) {
        require(
            id < currentListingId && id >= 0,
            "Invalid Listing Id"
        );
        _;
    }

    modifier onlyBefore(uint256 _time) {
        require(block.timestamp < _time);
        _;
    }
    modifier onlyAfter(uint256 _time) {
        require(block.timestamp > _time);
        _;
    }

    modifier validString(string memory str) {
        require(
            bytes(str).length <= 50,
            "String Length is 50 characters maximum"
        );
        _;
    }
}
