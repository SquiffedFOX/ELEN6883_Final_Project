// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol"; 
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract Market is ERC721Holder{
    enum ListStatus{
        active,
        sold,
        cancelled
    }
    struct List{
        ListStatus status;
        address seller;
        address token;
        uint tokenID;
        uint price;
    }
    
    event Listed(
        uint listingId,
        address seller,
        address token,
        uint tokenId,
        uint price
    );
    event Sale(
        uint listingId,
        address buyer,
        address token,
        uint tokenId,
        uint price
    );

    event Cancel(
        uint listingId,
        address seller
    );

    uint private _listingId = 0;
    mapping(uint => List) private _listings;


    function ListToken(address token, uint tokenID, uint price) external{ // List the NFT to store, and transfer the owner to store
        require(IERC721(token).ownerOf(tokenID) == msg.sender,"Only Onwer can list NFT");
        ERC721(token).safeTransferFrom(msg.sender, address(this), tokenID);

        _listingId++;

        _listings[_listingId] = List(
            ListStatus.active,
            msg.sender,
            token,
            tokenID,
            price
        );
        emit Listed(
            _listingId,
            msg.sender,
            token,
            tokenID,
            price
        );
    }
    function getListings(uint listingId) public view returns(List memory){
        return _listings[listingId];
    }

    function BuyToken(uint listingId) external payable{// The buyer buy the NFT
        List storage listing = _listings[listingId];

        if (listing.status == ListStatus.cancelled){
            revert("NFT is cancelled by seller");
        } 
        if (listing.status == ListStatus.sold){
            revert("NFT is sold out");
        }   
        if (msg.sender == listing.seller){
            revert("Seller cannot buy");
        }

        require(msg.value == listing.price, "Invalid payment");
        IERC721(listing.token).safeTransferFrom(address(this), msg.sender, listing.tokenID);
        payable(listing.seller).transfer(listing.price);
        listing.status = ListStatus.sold;
        emit Sale(
            listingId,
            msg.sender,
            listing.token,
            listing.tokenID,
            listing.price
        );
    }

    function cancel(uint listingID) public{// The seller can cancelled the NFT and NFT will transfer back the seller
        List storage listing = _listings[listingID];
        require(msg.sender == listing.seller,"Only seller can cancel Listing");// The store will check if the function caller is seller in record
        require(listing.status == ListStatus.active,"The item is not active");
        listing.status = ListStatus.cancelled;
        IERC721(listing.token).safeTransferFrom(address(this), msg.sender, listing.tokenID);
        emit Cancel(listingID, msg.sender);
    }
}
