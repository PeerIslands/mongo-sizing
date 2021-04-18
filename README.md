# MongoDB Sizing Calculator

This was originally written by [Gasparina Damien](http://github.com/dabz/) updated for use by the MongoDB Solutions Architecture team by [Michael Lynn](http://github.com/mrlynn). Forked and updated the look and feel in the UI to make it more professional and use by PeerIslands team by [Rajesh Vinayagam](https://github.com/rajeshvinaygam-lab).

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

You will need to have NodeJS, NPM, Angular available.

* Install Node.js and npm. 
* Download the latest version of Node.js if you do not already have it installed on your machine. ...

### Installing

A step by step series of examples that tell you have to get a development env running.

#### Mac OS

```
brew install node
```
## Start the server

```
cd mongo-sizing

# install all necessary packages 
npm install

# start the server
npm start
```

## Using the Tool

1. To use this tool for a sizing exercise, you start by clicking 'New Collection'.

1. A modal dialogue will appear that will enable you to create (or paste in) a sample document. 
1. click Add.
2. Notice there will be a tab created for your collection.  Click the body of your newly created document to modify it.  
3. Click the Sizing tab to view details of the sizing recommendations.
4. Modify the number of shards, avg document count and other settings to view detailed statistics.

## Authors

* **Damien Gasparina** - *Initial work* - [Github](https://github.com/DABZ)
* **Michael Lynn** - *Minor Mods for MongoDB SA's* - [Github](https://github.com/mrlynn)
* **Rajesh Vinayagam** - *Skinning and UI updates to make it more professional* - [Github](https://github.com/rajeshvinaygam-lab)

## License

This project is licensed under the MIT License
