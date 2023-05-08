const { expectRevert, expectEvent, BN } = require('@openzeppelin/test-helpers');

const Market = artifacts.require('Market');
const NFT = artifacts.require('NFT');

contract('Market', (accounts) => {
  let market;
  let token;

  const minter = accounts[1];
  const tokenId = new BN(1);
  let listingId = new BN(1);
  const price = new BN(1000);
  const name = "MyNFT";
  const description = "This is test NFT";
  const buyer = accounts[2];

  describe('create NFT',()=>{
    it('Should create a new NFT',async()=>{
        token = await NFT.new();
        await token.createNFT(name,description,{from: minter});
        const argus= await token.getNFT.call(tokenId);
        assert.equal(argus[0],name,"Name does not match");
        assert.equal(argus[1],description,"Description not match");

    })
    


  });

  describe('List token on market place', () => {
    before(async () => {
      market = await Market.new();
      token = await NFT.new();

      await token.createNFT(name, description,{ from: minter });
    });

    // it('should prevent listing - contract not approved', () => {
    //   return expectRevert(
    //     market.listToken(
    //     token.address,
    //     tokenId,
    //     price
    //   ), 'ERC721: transfer caller is not owner nor approved');
    // });
    it("should prevent listing - not owner listing NFT",async()=>{
        await token.approve(market.address, tokenId, {
            from: minter
          });
          return expectRevert(
            market.ListToken(token.address,tokenId,price, { from: buyer }),
            'Only Onwer can list NFT'
          );


    });
    it('should execute listing', async () => {
      await token.approve(market.address, tokenId, {
        from: minter
      });

      const txreceipt = await market.ListToken(
        token.address,
        tokenId,
        price,
        { from: minter }
      );

      expectEvent(txreceipt, 'Listed', {
        listingId,
        seller: minter,
        token: token.address,
        tokenId,
        price
      });

      return token.ownerOf(tokenId).then(owner => {
        assert.equal(owner, market.address, "Market contract is not the new owner."); 
      });
    });
  });

  

  describe('Buy NFT', () => {
    before(async () => {
      market = await Market.new();
      token = await NFT.new();

      await token.createNFT(name,description,{ from: minter });
      await token.approve(market.address, tokenId, {from: minter});

      await market.ListToken(
        token.address,
        tokenId,
        price,
        { from: minter }
      );
    });
    
    it('should prevent sale - seller cannot be buyer', () => {
      return expectRevert(
        market.BuyToken(listingId, { from: minter }),
        'Seller cannot buy'
      );
    });

    it('should prevent sale - not match the price', () => {
      return expectRevert(
        market.BuyToken(listingId, {
          from: buyer,
          value: 1
        }),
        'Invalid payment'
      );
    })

    it('should execute sale', async () => {
      const txreceipt = await market.BuyToken(listingId, {
        from: buyer,
        value: price
      });

      expectEvent(txreceipt, 'Sale', {
        listingId,
        buyer,
        token: token.address,
        tokenId,
        price
      });

      return token.ownerOf(tokenId).then(owner => {
        assert.equal(owner, buyer, "Buyer is not the new owner."); 
      });
    })

    it('should prevent sale - item is sold out', () => {
      return expectRevert(
        market.BuyToken(listingId, {
          from: buyer,
          value: price
        }),
        'NFT is sold out'
      );
    });
  });

  describe('Cancel listing', () => {
    before(async () => {
      market = await Market.new();
      token = await NFT.new();

      await token.createNFT(name,description,{ from: minter });
      await token.approve(market.address, tokenId, {
        from: minter
      });

      await market.ListToken(
        token.address,
        tokenId,
        price,
        { from: minter }
      );
    });

    it('should prevent cancellation - only seller can cancel', () => {
      return expectRevert(
        market.cancel(listingId, { from: buyer }),
        'Only seller can cancel Listing'
      );
    })

    it('should execute cancellation', async () => {
      const txreceipt = await market.cancel(listingId, { from: minter });

      expectEvent(txreceipt, 'Cancel', {
        listingId,
        seller: minter
      });
    })
    it('should prevent sale - the item was cancelled by seller', async () => {
        return expectRevert(market.BuyToken(listingId, {
          from: buyer,
          value: price
        }),
        "NFT is cancelled by seller");
      })

    it('should prevent cancellation - The item is not active', () => {
      return expectRevert(
        market.cancel(listingId, { from: minter }),
        'The item is not active'
      );
    })
  });
});