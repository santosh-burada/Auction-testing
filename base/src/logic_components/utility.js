import { get_secret } from "../get_secret";
import EthCrypto from "eth-crypto";

export const initiateAuction = async (inputData, contractInstances, web3Instance) => {
  console.log(inputData,"input data");
  const userAccounts = await web3Instance.eth.getAccounts();
  const { marketplace, blindAuctionInstance, vickreyAuctionInstance, averageAuctionInstance } = contractInstances;

  if (inputData.auctionType === "Normal Listing") {
    const { item_name, item_description, item_price } = inputData;
    await marketplace.methods.createListings(item_price, item_name, item_description)
      .send({ from: userAccounts[0] });
  } else {
    const { auctionType, item_name, item_description, bidding_deadline, reveal_deadline } = inputData;
    let bidDuration = parseInt(((new Date(bidding_deadline)).getTime() - Date.now()) / 1000);
    let revealDuration = parseInt(((new Date(reveal_deadline)).getTime() - Date.now()) / 1000) - bidDuration;

    if (bidding_deadline <= 0) {
      alert("Invalid Bid Deadline");
      return false;
    }
    if (revealDuration <= 0) {
      alert("Invalid Reveal Deadline");
      return false;
    }
    if (auctionType === "Blind Auction") {
      await blindAuctionInstance.methods.auctionItem(item_name, item_description, bidding_deadline, revealDuration)
        .send({ from: userAccounts[0] });
    } else if (auctionType === "Vickrey Auction") {
      await vickreyAuctionInstance.methods.auctionItem(item_name, item_description, bidding_deadline, revealDuration)
        .send({ from: userAccounts[0] });
    } else {
      await averageAuctionInstance.methods.auctionItem(item_name, item_description, bidding_deadline, revealDuration)
        .send({ from: userAccounts[0] });
    }
  }
};

export const decryptAuctionKey = async(auctionIndex, auctionType, submittedData, contractInstances, userAccount) => {
  const { marketplace, blindAuctionInstance, vickreyAuctionInstance, averageAuctionInstance } = contractInstances;
  const userPrivateKey = submittedData.pvtkey;
  try {
    if (auctionType === "Normal Listing") {
      let allListings = await marketplace.methods.fetchalllistings().call({ from: userAccount });
      let hashedKey = allListings[auctionIndex].encryptedKey;
      let encryptedData = EthCrypto.cipher.parse(hashedKey);
      return await EthCrypto.decryptWithPrivateKey(userPrivateKey, encryptedData);
    } else if (auctionType === "Blind Auction") {
      let allAuctions = await blindAuctionInstance.methods.getallauctions().call({ from: userAccount });
      let hashedKey = allAuctions[auctionIndex].encryptedKey;
      let encryptedData = EthCrypto.cipher.parse(hashedKey);
      return await EthCrypto.decryptWithPrivateKey(userPrivateKey, encryptedData);
    } else if (auctionType === "Vickrey Auction") {
      let allAuctions = await vickreyAuctionInstance.methods.getallauctions().call({ from: userAccount });
      let hashedKey = allAuctions[auctionIndex].encryptedKey;
      let encryptedData = EthCrypto.cipher.parse(hashedKey);
      return await EthCrypto.decryptWithPrivateKey(userPrivateKey, encryptedData);
    } else {
      let allAuctions = await averageAuctionInstance.methods.getallauctions().call({ from: userAccount });
      let hashedKey = allAuctions[auctionIndex].encryptedKey;
      let encryptedData = EthCrypto.cipher.parse(hashedKey);
      return await EthCrypto.decryptWithPrivateKey(userPrivateKey, encryptedData);
    }
    } catch (error) {
    console.log(error);
    alert("Error decrypting key");
    }
};

export const confirmDelivery = async (auction_id, type, state) => {
  const { market, blind_contract, vickrey_contract, average_contract, currentAccount, web3 } = state;

  try {
    if (type === "Normal Listing") {
      await market.methods.confirmDelivery(auction_id).send({ from: currentAccount, gas: 1000000, gasPrice: web3.utils.toWei('20', 'gwei') });
    } else if (type === "Blind Auction") {
      await blind_contract.methods.confirmDelivery(auction_id).send({ from: currentAccount, gas: 1000000, gasPrice: web3.utils.toWei('20', 'gwei') });
    } else if (type === "Vikrey Auction") {
      await vickrey_contract.methods.confirmDelivery(auction_id).send({ from: currentAccount, gas: 1000000, gasPrice: web3.utils.toWei('20', 'gwei') });
    } else {
      await average_contract.methods.confirmDelivery(auction_id).send({ from: currentAccount, gas: 1000000, gasPrice: web3.utils.toWei('20', 'gwei') });
    }
  } catch (error) {
    alert(`Error! Could not confirm: ${error}`);
  }
};
    

export const makeBid = async (auction_id, type, price, contracts) => {
  const { blind_contract, vickrey_contract, average_contract, currentAccount, web3, SubmissionData, market } = contracts;
  try {
    if (type === "Normal Listing") {
      const { publickey } = SubmissionData;
      console.log(publickey,"publickey")
      console.log(auction_id,"auction_d")
      
     
      await market.methods.requestBuy(auction_id, publickey)
        .send({
          from: currentAccount,
          value: price * 2
        });
        
    } else {
      const { value, secret_key, deposit, publickey } = SubmissionData;
      if (type === "Blind Auction") {
        await blind_contract.methods.bid(
          web3.utils.keccak256(
            web3.eth.abi.encodeParameters(
              ["uint256", "string"],
              [value, secret_key]
            )
          ),
          parseInt(auction_id),
          publickey
        ).send({
          from: currentAccount,
          value: deposit
        });
      } else if (type === "Vikrey Auction") {
        await vickrey_contract.methods.bid(
          web3.utils.keccak256(
            web3.eth.abi.encodeParameters(
              ["uint256", "string"],
              [value, secret_key]
            )
          ),
          parseInt(auction_id),
          publickey
        ).send({
          from: currentAccount,
          value: deposit
        });
      } else {
        await average_contract.methods.bid(
          web3.utils.keccak256(
            web3.eth.abi.encodeParameters(
              ["uint256", "string"],
              [value, secret_key]
            )
          ),
          parseInt(auction_id),
          publickey
        ).send({
          from: currentAccount,
          value: deposit
        });
      }
    }
  } catch (error) {
    alert(`Error in makebid: ${error.message}`);
  }
};

export const revealBid = async (auction_id, type, SubmissionData, contracts, currentAccount) => {
  const { value, secret_key } = SubmissionData;
  const { blind_contract, vickrey_contract, average_contract } = contracts;

  try {
    if (type === "Blind Auction") {
      await blind_contract.methods.reveal(
        value,
        secret_key,
        parseInt(auction_id)
      ).send({
        from: currentAccount
      });
    } else if (type === "Vikrey Auction") {
      await vickrey_contract.methods.reveal(
        value,
        secret_key,
        parseInt(auction_id)
      ).send({
        from: currentAccount
      });
    } else {
      await average_contract.methods.reveal(
        value,
        secret_key,
        parseInt(auction_id)
      ).send({
        from: currentAccount
      });
    }
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
};

export async function sellItem(auction_id, type, SubmissionData, state) {
  const { market, blind_contract, vickrey_contract, average_contract, currentAccount } = state;

  try {
    if (type === "Normal Listing") {
      let marketListings = await this.state.market.methods.fetchalllistings().call({ from: this.state.currentAccount });
      let pubkey = marketListings[auction_id].pubkey;
      let secret = await get_secret(pubkey, this.state.SubmissionData.unique_string);
      let value = (marketListings[auction_id].price * 2);
      await this.state.market.methods.sellItem(auction_id, secret)
        .send({
          from: this.state.currentAccount,
          value
        });
    }
    else if (type === "Blind Auction") {
      let marketListings = await this.state.blind_contract.methods.getallauctions().call({ from: this.state.currentAccount });
      let pubkey = marketListings[auction_id].pubkey;
      let secret = await get_secret(pubkey, this.state.SubmissionData.unique_string);
      let value = (marketListings[auction_id].finalBid * 2);
      await this.state.blind_contract.methods.sellItem(auction_id, secret)
        .send({
          from: this.state.currentAccount,
          value
        });

    } else if (type === "Vikrey Auction") {
      let marketListings = await this.state.vickrey_contract.methods.getallauctions().call({ from: this.state.currentAccount });
      let pubkey = marketListings[auction_id].pubkey;
      let secret = await get_secret(pubkey, this.state.SubmissionData.unique_string);
      let value = (marketListings[auction_id].finalBid * 2);
      await this.state.vickrey_contract.methods.sellItem(auction_id, secret)
        .send({
          from: this.state.currentAccount,
          value
        });

    } else {
      let marketListings = await this.state.average_contract.methods.getallauctions().call({ from: this.state.currentAccount });
      let pubkey = marketListings[auction_id].pubkey;
      let secr = await get_secret(pubkey, this.state.SubmissionData.unique_string);
      let value = (marketListings[auction_id].finalBid * 2);
      await this.state.average_contract.methods.sellItem(auction_id, secr)
        .send({
          from: this.state.currentAccount,
          value
        });

    }
  } catch (error) {
    throw new Error(`Sell Item Error: ${error}`);
  }
};

export const endAuction = async (auction_id, type, state) => {
  const { market, blind_contract, vickrey_contract, average_contract, currentAccount } = state;
  try {
    if (type === "Normal Listing") {
      await market.methods.sellItem(
        parseInt(auction_id),
        state.SubmissionData.unique_string
      ).send({
        from: currentAccount
      });
    }
    else if (type === "Blind Auction") {
      await blind_contract.methods.auctionEnd(
        parseInt(auction_id)
      ).send({
        from: currentAccount
      });
    } else if (type === "Vikrey Auction") {
      await vickrey_contract.methods.auctionEnd(
        parseInt(auction_id)
      ).send({
        from: currentAccount
      });
    } else {
      await average_contract.methods.auctionEnd(
        parseInt(auction_id)
      ).send({
        from: currentAccount
      });
    }
  } catch (error) {
    alert(`End Auction Error: ${error.message}`);
  }
};
