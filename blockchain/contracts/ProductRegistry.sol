// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract ProductRegistry {
    struct Product {
        string productName;
        string brand;
        string model;
        string identifierType;
        string identifierValue;
        string imeiNumber;
        string macAddress;
        address manufacturer;
        uint256 registrationDate;
        bool isRegistered;
    }

    mapping(string => Product) private products;
    mapping(string => bool) private productExists;

    event ProductRegistered(
        string indexed identifierType,
        string indexed identifierValue,
        string productName,
        string brand,
        address indexed manufacturer,
        uint256 registrationDate
    );

    event ProductVerified(
        string indexed identifierType,
        string indexed identifierValue,
        bool isValid,
        string productName
    );

    function _isSupportedIdentifierType(string memory _identifierType)
        private
        pure
        returns (bool)
    {
        bytes32 identifierHash = keccak256(bytes(_identifierType));
        return (
            identifierHash == keccak256(bytes("imei")) ||
            identifierHash == keccak256(bytes("mac"))
        );
    }

    function _buildKey(
        string memory _identifierType,
        string memory _identifierValue
    ) private pure returns (string memory) {
        return string(abi.encodePacked(_identifierType, ":", _identifierValue));
    }

    function registerProduct(
        string memory _identifierType,
        string memory _identifierValue,
        string memory _productName,
        string memory _brand,
        string memory _model
    ) public returns (bool) {
        require(
            _isSupportedIdentifierType(_identifierType),
            "Unsupported identifier type"
        );
        require(bytes(_identifierValue).length > 0, "Identifier value is required");
        require(bytes(_productName).length > 0, "Product name is required");

        string memory productKey = _buildKey(_identifierType, _identifierValue);
        require(!productExists[productKey], "Product already registered");

        bytes32 identifierHash = keccak256(bytes(_identifierType));
        string memory imeiNumber = "";
        string memory macAddress = "";

        if (identifierHash == keccak256(bytes("imei"))) {
            imeiNumber = _identifierValue;
        } else {
            macAddress = _identifierValue;
        }

        products[productKey] = Product({
            productName: _productName,
            brand: _brand,
            model: _model,
            identifierType: _identifierType,
            identifierValue: _identifierValue,
            imeiNumber: imeiNumber,
            macAddress: macAddress,
            manufacturer: msg.sender,
            registrationDate: block.timestamp,
            isRegistered: true
        });

        productExists[productKey] = true;

        emit ProductRegistered(
            _identifierType,
            _identifierValue,
            _productName,
            _brand,
            msg.sender,
            block.timestamp
        );

        return true;
    }

    function verifyProduct(
        string memory _identifierType,
        string memory _identifierValue
    ) public returns (bool isValid, Product memory product) {
        require(
            _isSupportedIdentifierType(_identifierType),
            "Unsupported identifier type"
        );
        require(bytes(_identifierValue).length > 0, "Identifier value is required");

        string memory productKey = _buildKey(_identifierType, _identifierValue);
        Product memory prod = products[productKey];
        bool valid = prod.isRegistered;

        emit ProductVerified(
            _identifierType,
            _identifierValue,
            valid,
            prod.productName
        );

        return (valid, prod);
    }

    function getProduct(
        string memory _identifierType,
        string memory _identifierValue
    ) public view returns (Product memory) {
        string memory productKey = _buildKey(_identifierType, _identifierValue);
        require(productExists[productKey], "Product not found");
        return products[productKey];
    }

    function isProductRegistered(
        string memory _identifierType,
        string memory _identifierValue
    ) public view returns (bool) {
        string memory productKey = _buildKey(_identifierType, _identifierValue);
        return productExists[productKey];
    }
}
