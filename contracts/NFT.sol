// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 


contract NFT is ERC721{
    struct MyNFT{
        string name;
        string description;
    }
    
    mapping(uint256 => MyNFT) public nfts;
    uint256 private _tokenID = 0;
    constructor() ERC721("MyNFT","NFT"){}
    function createNFT(string memory name, string memory description) external returns(uint256){  //create a new NFT, and owner will be the caller
        _tokenID++;
        _safeMint(msg.sender,_tokenID);
        nfts[_tokenID] = MyNFT({
            name: name,
            description: description
        });
        return _tokenID;
    }
    function getNFT(uint256 id) external view returns(string memory,string memory){//function to get property of the NFT
        require(_exists(id),"NFT not exist");
        string memory my_name = nfts[id].name;
        string memory my_description = nfts[id].description;
        return (my_name,my_description);
    }

}