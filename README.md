
# Blind Auction Screenshot

![Screenshot (31)](https://user-images.githubusercontent.com/55043057/236997808-da153d5b-9bc8-4924-91d2-97fab0a8a117.png)


# All Auctions

# functionalities 
- Initiating auctions
- Engaging in ongoing auctions
- Submitting concealed bids and disclosing them once the bidding period ends
- Ending the auction by the event coordinator
- Validating bids, determining the winner, and announcing the results
- Ensuring the item is delivered to the winning bidder with proper confirmation
- Added Encryption for every account and parties can access the items
- Added to Goerli test network.
- Developed the frontend using ReactJs.

### App have four types of auctions

- Noraml Auction
- Blind auction
- Vickery auction
- Average auction

### Setup

```bash
cd base
npm install
npm start
```

**Steps to deploy code in test network:**
- Generate the ***API_KEY*** using infura
- Next make changes in the truffle-config.js for the network connection

```bash
npm install @truffle/hdwallet-provider
```
- Next compile and deploy the contract to the test network using the following commands
```bash
truffle compile
truffle deploy --network network-name
```

    

