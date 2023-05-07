import React, { Component } from 'react'
import { Table, Button, InputGroup } from 'react-bootstrap';
import { decryptAuctionKey,confirmDelivery,makeBid, endAuction, revealBid, sellItem } from './utility';

class AuctionHouse extends Component {
  constructor(props) {
    super(props)
    this.state = {
      web3: null,
      accounts: null,
      currentAccount: null,
      market: null,
      blind_contract: null,
      vickrey_contract: null,
      average_contract: null,
      ItemDirectory: [],
      SubmitProposal: false,
      SubmissionData: {},
      DecodedData: null
    }
    this.handleChange = this.handleChange.bind(this);
    this.makeBid = this.makeBid.bind(this);
    this.sellItem = this.sellItem.bind(this);
    this.verify = this.verify.bind(this);
    this.revealBid = this.revealBid.bind(this);
  }
  componentDidMount = async () => {
    try {
      this.setState({
        vickrey_contract: this.props.vickrey_contract,
        blind_contract: this.props.blind_contract,
        average_contract: this.props.average_contract,
        market: this.props.market,
        web3: this.props.web3,
        currentAccount: this.props.account
      });
      console.log('Account:', this.props.account);
      console.log('Contracts:', {
        vickrey: this.props.vickrey_contract,
        blind: this.props.blind_contract,
        average: this.props.average_contract,
        market: this.props.market,
      });


      let offSet = 1000;
      console.log('Fetching market listings...');
      let marketListings = await this.props.market.methods.fetchActiveListings().call({ from: this.props.account });
      console.log('Fetched market listings:', marketListings);
      for (let i = 0; i < marketListings.length; ++i) {
        console.log(i);
        marketListings[i]["type"] = "Normal Listing";
        marketListings[i]["new_auction_id"] = parseInt(marketListings[i]["id"]) + offSet;
        marketListings[i]["bidding_deadline"] = "NA";
        marketListings[i]["reveal_deadline"] = "NA";
      }
      console.log('Fetching blind listings...');
      offSet += marketListings.length;
      let blindAuctions = await this.props.blind_contract.methods.getactiveauctions().call({ from: this.props.account });
      for (let i = 0; i < blindAuctions.length; ++i) {
        blindAuctions[i]["type"] = "Blind Auction";
        blindAuctions[i]["new_auction_id"] = parseInt(blindAuctions[i]["auction_id"]) + offSet;
        blindAuctions[i]["bidding_deadline"] = new Date(blindAuctions[i]["biddingEnd"] * 1000);
        blindAuctions[i]["reveal_deadline"] = new Date(blindAuctions[i]["revealEnd"] * 1000);
      }
      console.log(blindAuctions,"blindauctions")

      offSet += blindAuctions.length;
      let vikreyAuctions = await this.props.vickrey_contract.methods.getactiveauctions().call({ from: this.props.account });
      for (let i = 0; i < vikreyAuctions.length; ++i) {
        vikreyAuctions[i]["type"] = "Vikrey Auction";
        vikreyAuctions[i]["new_auction_id"] = parseInt(vikreyAuctions[i]["auction_id"]) + offSet;
        vikreyAuctions[i]["bidding_deadline"] = new Date(vikreyAuctions[i]["biddingEnd"] * 1000);
        vikreyAuctions[i]["reveal_deadline"] = new Date(vikreyAuctions[i]["revealEnd"] * 1000);
      }

      offSet += vikreyAuctions.length;
      let averageAuctions = await this.props.average_contract.methods.getactiveauctions().call({ from: this.props.account });
      for (let i = 0; i < averageAuctions.length; ++i) {
        averageAuctions[i]["type"] = "Average Price Auction";
        averageAuctions[i]["new_auction_id"] = parseInt(averageAuctions[i]["auction_id"]) + offSet;
        averageAuctions[i]["bidding_deadline"] = new Date(averageAuctions[i]["biddingEnd"] * 1000);
        averageAuctions[i]["reveal_deadline"] = new Date(averageAuctions[i]["revealEnd"] * 1000);
      }

      offSet += averageAuctions.length;
      let auctions = [].concat(marketListings, blindAuctions, vikreyAuctions, averageAuctions);
      this.setState({ ItemDirectory: auctions });
      console.log(auctions, "auctions for bid")
    } catch (error) {
      alert(error);
    }
  };

  verify = (auction_id, type) => async (e) => {
    e.preventDefault();
    const { SubmissionData, currentAccount, marketplace, blindAuctionInstance, vickreyAuctionInstance, averageAuctionInstance } = this.state;
    const contracts = { marketplace, blindAuctionInstance, vickreyAuctionInstance, averageAuctionInstance };

    try {
      const DecodedData=await decryptAuctionKey(auction_id, type,SubmissionData,contracts,currentAccount)
      console.log(DecodedData)
      this.setState({DecodedData})
      }
     catch (err) {
      console.log(err);
      alert(`Error in decrypting key`);
    }
  };

  revealBid = (auction_id, type) => async (e) => {
    e.preventDefault();
    const { value, secret_key } = this.state.SubmissionData;
    const { blind_contract, vickrey_contract, average_contract, web3, currentAccount } = this.state
    const contracts = {blind_contract, vickrey_contract, average_contract };
    const sdata={value, secret_key}

    try {
      await revealBid(auction_id, type, sdata, contracts, currentAccount);
      window.location.reload(false);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  sellItem = (auction_id, type) => async (e) => {
    try {
      await sellItem(auction_id, type, this.state.SubmissionData, this.state);
    } catch (error) {
      alert(`Sell Item Error: ${error}`);
    }
  };
  makeBid = (auction_id, type, price) => async (e) => {
    console.log("in makebid");
    try {
      const { blind_contract, vickrey_contract, average_contract, currentAccount, web3, SubmissionData, market } = this.state
      console.log(blind_contract,"blind");
      const contracts = { blind_contract, vickrey_contract, average_contract, currentAccount, web3, SubmissionData, market}

      this.setState({makeBid: !this.state.makeBid});
      await makeBid(auction_id, type, price, contracts);
    }catch(error){
      alert(`error in makebid:${error}`);
    }

  }

  handleChange(e) {
    e.preventDefault();
    const SubmissionData = Object.assign({}, this.state.SubmissionData);
    SubmissionData[e.target.id] = e.target.value;
    this.setState({ SubmissionData: SubmissionData });
  };

  render() {
    return (
      <>
        <h2>The active listings are:</h2>
        <br />
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <Table striped bordered hover>
            <thead>
              <tr>
                <td>Auction ID</td>
                <td>Auction Type</td>
                <td>Item Name</td>
                <td>Item Description</td>
                <td>Item Price</td>
                <td>Bidding Deadline</td>
                <td>Bid Reveal Deadline</td>
                <td>Manage</td>
              </tr>
            </thead>
            <tbody>
              {this.state.ItemDirectory.map(ItemDirectory => {
                console.log(ItemDirectory,"item dic")
                let status = 'Active'
                let type = 'Normal'
                
                if (ItemDirectory.type === "Normal Listing") {
                  if (ItemDirectory.buyerAssigned) {
                    status = 'Requested'
                  }
                  if (ItemDirectory.encryptedKey) {
                    status = 'Sold'
                  }
                  if (ItemDirectory.sold_or_withdrawn) {
                    status = 'Done'
                  }
                } else {
                  type = 'Not'
                  if (Date.now() > ItemDirectory.bidding_deadline) {
                    status = 'Bidding Over'
                  }
                  if (Date.now() > ItemDirectory.reveal_deadline) {
                    status = 'Reveal Over'
                  }
                  if (ItemDirectory.ended) {
                    status = 'Ended'
                  }
                  if (ItemDirectory.encryptedKey) {
                    status = 'Sold'
                  }
                  if (ItemDirectory.sold) {
                    status = 'Done'
                  }
                }
                console.log(status, "status");
                return (
                  <tr key={ItemDirectory.new_auction_id}>
                    <td>{ItemDirectory.new_auction_id}</td>
                    <td>{ItemDirectory.type}</td>
                    <td>{ItemDirectory.item_name}</td>
                    <td>{ItemDirectory.item_description}</td>
                    <td>{ItemDirectory.type != "Normal Listing" ? "NA" : ItemDirectory.price}</td>
                    <td>{ItemDirectory.type != "Normal Listing" ? ItemDirectory.bidding_deadline.toString() : ItemDirectory.bidding_deadline}</td>
                    <td>{ItemDirectory.type != "Normal Listing" ? ItemDirectory.reveal_deadline.toString() : ItemDirectory.reveal_deadline}</td>
                    <td>
                      {ItemDirectory.beneficiary === this.state.currentAccount ?
                        // Seller
                        (type === "Normal") ?
                          (status === 'Active') ?
                            <Button variant="outline-success" disabled>Active</Button>
                            :
                            (status === 'Requested') ?
                              <>
                                <p>Item requested. <br /> Buyer: {ItemDirectory.buyer ? ItemDirectory.buyer : "None"} <br /> Selling Price: {ItemDirectory.price}</p>
                                <input type="string" className="form-control" id="unique_string" required onChange={this.handleChange} placeholder="Unique String" />
                                <Button variant="success" onClick={this.sellItem(ItemDirectory.new_auction_id, ItemDirectory.type)}>Sell Item</Button>
                              </>
                              :
                              (status === 'Sold') ?
                                <>
                                  <Button variant="outline-info" disabled>Out for Delivery</Button>
                                  <p><br /> Buyer: {ItemDirectory.buyer ? ItemDirectory.buyer : "None"} <br /> Selling Price: {ItemDirectory.price}</p>
                                </>
                                :
                                <></>
                          :
                          // Auctions
                          (status === 'Active' || status === "Bidding Over") ?
                            <Button variant="outline-success" disabled>Active</Button>
                            :
                            (status === 'Reveal Over') ?
                              <Button onClick={() => endAuction(ItemDirectory.new_auction_id, ItemDirectory.type, this.state)} variant="danger">End Auction</Button>
                              :
                              (status === 'Ended') ?
                                <>
                                  <p>Auction Ended Successfully. <br /> Winner: {ItemDirectory.winner ? ItemDirectory.winner : "None"} <br /> Winning Bid: {ItemDirectory.finalBid > 0 ? ItemDirectory.finalBid : "NA"}</p>
                                  <input type="string" className="form-control" id="unique_string" required onChange={this.handleChange} placeholder="Unique String" />
                                  <Button variant="success" onClick={this.sellItem(ItemDirectory.new_auction_id, ItemDirectory.type)}>Sell Item</Button>
                                </>
                                :
                                (status === 'Sold') ?
                                  <>
                                    <Button variant="outline-info" disabled>Out for Delivery</Button>
                                  </>
                                  :
                                  <Button variant="outline-success" disabled>Delivered</Button>
                        :
                        // Buyer
                        (type === "Normal") ?
                          // Market
                          (status === 'Active') ?
                            <>
                              <InputGroup>
                                <input type="string" className="form-control" id="publickey" required onChange={this.handleChange} placeholder="Public Key" />
                              </InputGroup>
                              <Button variant="primary" onClick={this.makeBid(ItemDirectory.new_auction_id, ItemDirectory.type, ItemDirectory.price)}>Buy Item</Button>
                            </>
                            :
                            // Requested to Buy
                            (status === 'Requested') ?
                              <>
                                {ItemDirectory.buyer === this.state.currentAccount ?
                                  <Button variant="info" disabled>Requested to Buy</Button>
                                  :
                                  <Button variant="outline-danger" disabled>Buyer has been Alloted</Button>
                                }
                              </>
                              :
                              // Sold by owner
                              (status === 'Sold') ?
                                <>
                                  {this.state.DecodedData ?
                                    <>
                                      <p>Decrypted string: {this.state.DecodedData}</p>
                                      <Button variant="primary" onClick={(e) => {
                                        e.preventDefault();
                                        confirmDelivery(ItemDirectory.new_auction_id, ItemDirectory.type, this.state);
                                      }}>Confirm Delivery</Button>
                                    </>
                                    :
                                    <>
                                      <InputGroup>
                                        <input type="password" className="form-control" id="pvtkey" required onChange={this.handleChange} placeholder="Private Key" />
                                      </InputGroup>
                                      <Button variant="warning" onClick={this.verify(ItemDirectory.new_auction_id, ItemDirectory.type)}>Decrypt Item String</Button>
                                    </>
                                  }
                                </>
                                :
                                // Delivered
                                <Button variant="outline-success" disabled>Delivered</Button>
                          :
                          // Auctions
                          (status === 'Active') ?
                            <>
                              {ItemDirectory.bidplaced === true ?
                                <Button variant="info" disabled>Bid Placed</Button>
                                :
                                <>
                                  <InputGroup>
                                    <input type="number" className="form-control" id="value" required onChange={this.handleChange} placeholder="Bid Amount" />
                                    <input type="password" className="form-control" id="secret_key" required onChange={this.handleChange} placeholder="Secret Key" />
                                  </InputGroup>
                                  <InputGroup>
                                    <input type="number" className="form-control" id="deposit" required onChange={this.handleChange} placeholder="Deposit Amount (>2*Bid Amount)" />
                                    <input type="string" className="form-control" id="publickey" required onChange={this.handleChange} placeholder="Public Key" />
                                  </InputGroup>
                                  <Button variant="primary" onClick={this.makeBid(ItemDirectory.new_auction_id, ItemDirectory.type, ItemDirectory.price, this.state)
                                  }>Buy Item</Button>
                                </>
                              }
                            </>
                            :
                            // Bidding Time ended
                            (status === 'Bidding Over') ?
                              <>
                                {ItemDirectory.bidplaced === true ?
                                  ItemDirectory.revealed ?
                                    <Button variant="info" disabled>Revealed</Button>
                                    :
                                    <>
                                      <InputGroup>
                                        <input type="number" className="form-control" id="value" required onChange={this.handleChange} placeholder="Bid Amount" />
                                        <input type="password" className="form-control" id="secret_key" required onChange={this.handleChange} placeholder="Secret Key" />
                                      </InputGroup>
                                      <Button variant="info" onClick={this.revealBid(ItemDirectory.new_auction_id, ItemDirectory.type)}>Reveal Bid</Button>
                                    </>
                                  :
                                  <Button variant="danger" disabled>Bidding Time Over</Button>
                                }
                              </>
                              :
                              // Auction reveal deadline
                              (status === 'Reveal Over') ?
                                <Button variant="danger" disabled>Reveal Time Over. <br />Wait for auction end.</Button>
                                :
                                // Auction ended
                                (status === 'Ended') ?
                                  <>
                                    {ItemDirectory.winner === this.state.currentAccount ?
                                      <>
                                        <Button variant="success" disabled>Auction Won! <br />
                                          Bid Price: {ItemDirectory.finalBid > 0 ? ItemDirectory.finalBid : "NA"} </Button>
                                      </>
                                      :
                                      <Button variant="info" disabled>Auction Ended. <br />
                                        Won by: {ItemDirectory.winner ? ItemDirectory.winner : "None"} <br />
                                        Winning Bid: {ItemDirectory.finalBid > 0 ? ItemDirectory.finalBid : "NA"}</Button>
                                    }
                                  </>
                                  :
                                  // Sold by owner
                                  (status === 'Sold') ?
                                    <>
                                      {ItemDirectory.winner === this.state.currentAccount ?
                                        <>
                                          <Button variant="success" disabled>Auction Won! <br />
                                            Bid Price: {ItemDirectory.finalBid > 0 ? ItemDirectory.finalBid : "NA"} </Button>
                                          <br />
                                          <InputGroup>
                                            <input type="password" className="form-control" id="pvtkey" required onChange={this.handleChange} placeholder="Private Key" />
                                          </InputGroup>
                                          <Button variant="primary" onClick={confirmDelivery(ItemDirectory.new_auction_id, ItemDirectory.type)}>Confirm Delivery</Button>
                                        </>
                                        :
                                        <Button variant="info" disabled>Auction Ended. <br />
                                          Won by: {ItemDirectory.winner ? ItemDirectory.winner : "None"} <br />
                                          Winning Bid: {ItemDirectory.finalBid > 0 ? ItemDirectory.finalBid : "NA"}</Button>
                                      }
                                    </>
                                    :
                                    // Delivered
                                    (status === 'Done') ?
                                      <Button variant="success" disabled>Delivered </Button>
                                      :
                                      <> Wait for Auction End </>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      </>
    );
  }
}

export default AuctionHouse;