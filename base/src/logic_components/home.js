import React, { Component } from 'react';
import { Card, Button, Carousel } from 'react-bootstrap';
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
      <div className="d-flex justify-content-center">
      <div style={{ width: '100%'}}>       
        <Carousel>
        <Carousel.Item>
            <Card style={{ width: '100%'}}>
              <Card.Img variant="top" src="items.jpg" alt="te" style={{ height: '380px'}} />
              <Card.Body>
                <Card.Title>Create Auction Listing</Card.Title>
                <Card.Text>
                  Host your own auction and add it to the auctions!
                </Card.Text>
                <Link to="/create">
                	<Button variant="dark">List your item</Button>
                </Link>
              </Card.Body>
            </Card>
            </Carousel.Item>

          <Carousel.Item>
            <Card style={{ width: '100%'}}>
              <Card.Img variant="top" src="auction.jpg" alt="te" style={{ height: '380px'}} />
              <Card.Body>
                <Card.Title>Auction House</Card.Title>
                <Card.Text>
                  Have a look at the active listings in the auction house!
                </Card.Text>
                <Link to="/auctionhouse">
                	<Button variant="dark">Go to Auction House</Button>
                </Link>
              </Card.Body>
            </Card>
            </Carousel.Item>
          
        <Carousel.Item>
        <Card style={{ width: '100%'}}>
            <Card.Img variant="top" src="individualbids.jpg" alt="te" style={{ height: '380px'}} />
            <Card.Body>
							<Card.Title>My Bids</Card.Title>
							<Card.Text>
								Look and manage your current bids!
							</Card.Text>
							<Link to="/mybids">
								<Button variant="dark">My Bids</Button>
							</Link>
            </Card.Body>
          </Card>
          </Carousel.Item>

        <Carousel.Item>
          <Card style={{ width: '100%'}}>
            <Card.Img variant="top" src="onlineauctions.jpg" alt="te" style={{ height: '380px'}} />
            <Card.Body>
							<Card.Title>My Auctions</Card.Title>
							<Card.Text>
								Look and manage your auctions!
							</Card.Text>
							<Link to="/myauctions">
								<Button variant="dark">My Auctions</Button>
							</Link>
            </Card.Body>
          </Card>
          </Carousel.Item>
          
        </Carousel>
        </div>
      </div>
    );
  }
}

export default Dashboard;