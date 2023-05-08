// const Migrations = artifacts.require('Migrations');
const Market = artifacts.require('Market.sol');
const NFT = artifacts.require("NFT.sol");
module.exports = function(deployer){
    // deployer.deploy(Migrations);
    deployer.deploy(NFT)
    deployer.deploy(Market);
};