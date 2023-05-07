import React, { Component } from 'react';
import { Card, Button, CardGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Dashboard component
class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      accounts: null,
      currentAccount: null,
      market: null,
      blind_contract: null,
      vickrey_contract: null,
      average_contract: null,
      formData: {},
    };
  }

  // Lifecycle method to initialize component state
  async componentDidMount() {
    this.setState({
      vickrey_contract: this.props.vickrey_contract,
      blind_contract: this.props.blind_contract,
      average_contract: this.props.average_contract,
      market: this.props.market,
      web3: this.props.web3,
      currentAccount: this.props.account,
    });
  }

  // Render method for the Dashboard component
  render() {
    return (
      <>
        <h1>Smart Auction</h1>
        <br />

        {/* Card Group for Auction House and Create Auction Listing */}
        <CardGroup>
          {/* Auction House Card */}
          <Card style={{ width: '18rem', margin: '0 10px' }}>
            <Card.Img variant="top" src="auctionhouse.png" alt="Auction House" />
            <Card.Body>
              <Card.Title>Auction House</Card.Title>
              <Card.Text>
                Explore active listings in the auction house!
              </Card.Text>
              <Link to="/auctionhouse">
                <Button variant="primary">Go to Auction House</Button>
              </Link>
            </Card.Body>
          </Card>

          {/* Create Auction Listing Card */}
          <Card style={{ width: '18rem', margin: '0 10px' }}>
            <Card.Img variant="top" src="listitem.png" alt="List Item" />
            <Card.Body>
              <Card.Title>Create Auction Listing</Card.Title>
              <Card.Text>
                Host an auction and add it to the listings!
              </Card.Text>
              <Link to="/create">
                <Button variant="warning">List your item</Button>
              </Link>
            </Card.Body>
          </Card>
        </CardGroup>
        <br />

        {/* Card Group for My Auctions and My Bids */}
        <CardGroup>
          {/* My Auctions Card */}
          <Card style={{ width: '18rem', margin: '0 10px' }}>
            <Card.Img variant="top" src="myauctions.png" alt="My Auctions" />
            <Card.Body>
              <Card.Title>My Auctions</Card.Title>
              <Card.Text>
                Manage your auctions!
              </Card.Text>
              <Link to="/myauctions">
                <Button variant="primary">My Auctions</Button>
              </Link>
            </Card.Body>
          </Card>

          {/* My Bids Card */}
          <Card style={{ width: '18rem', margin: '0 10px' }}>
            <Card.Img variant="top" src="mybids.png" alt="My Bids" />
            <Card.Body>
              <Card.Title>My Bids</Card.Title>
              <Card.Text>
                Manage your current bids!
              </Card.Text>
              <Link to="/mybids">
                <Button variant="primary">My Bids</Button>
              </Link>
            </Card.Body>
          </Card>
        </CardGroup>
      </>
    );
  }
}

export default Dashboard;