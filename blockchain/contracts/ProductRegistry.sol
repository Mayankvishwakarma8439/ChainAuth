// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract ProductRegistry {
    struct Product {
        string productName;
        string brand;
        string model;
        string imeiNumber;
        address manufacturer;
        uint256 registrationDate;
        bool isRegistered;
    }
    
    mapping(string => Product) private products;
    mapping(string => bool) private imeiExists;
    
    event ProductRegistered(
        string indexed imeiNumber,
        string productName,
        string brand,
        address indexed manufacturer,
        uint256 registrationDate
    );
    
    event ProductVerified(
        string indexed imeiNumber,
        bool isValid,
        string productName
    );
    
    function registerProduct(
        string memory _imeiNumber,
        string memory _productName,
        string memory _brand,
        string memory _model
    ) public returns (bool) {
        require(bytes(_imeiNumber).length > 0, "IMEI number is required");
        require(bytes(_productName).length > 0, "Product name is required");
        require(!imeiExists[_imeiNumber], "Product already registered with this IMEI");
        
        products[_imeiNumber] = Product({
            productName: _productName,
            brand: _brand,
            model: _model,
            imeiNumber: _imeiNumber,
            manufacturer: msg.sender,
            registrationDate: block.timestamp,
            isRegistered: true
        });
        
        imeiExists[_imeiNumber] = true;
        
        emit ProductRegistered(
            _imeiNumber,
            _productName,
            _brand,
            msg.sender,
            block.timestamp
        );
        
        return true;
    }
    
    function verifyProduct(string memory _imeiNumber) 
        public 
        returns (bool isValid, Product memory product) 
    {
        require(bytes(_imeiNumber).length > 0, "IMEI number is required");
        
        Product memory prod = products[_imeiNumber];
        bool valid = prod.isRegistered;
        
        emit ProductVerified(_imeiNumber, valid, prod.productName);
        
        return (valid, prod);
    }
    
    function getProduct(string memory _imeiNumber) 
        public 
        view 
        returns (Product memory) 
    {
        require(imeiExists[_imeiNumber], "Product not found");
        return products[_imeiNumber];
    }
    
    function isProductRegistered(string memory _imeiNumber) 
        public 
        view 
        returns (bool) 
    {
        return imeiExists[_imeiNumber];
    }
}