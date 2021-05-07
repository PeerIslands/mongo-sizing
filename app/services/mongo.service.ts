import {MongoIndex} from '/app/services/index.service';
import {MongoCollection} from '/app/services/collection.service';

export class MongoService {
  public _shards: int;
  public _engine: string;
  public _compression: string;
  public _oplog: int;
  public collections: Observable<Array<MongoCollection>>;
  public summary: Summary;

  constructor() {
    this.summary = { totalAverageDocumentSize:0 ,totalDataSize : 0,totalDocuments:0,totalDocumentsInMemory:0,totalIndexSize:0,totalIndexes:0,totalMemoryRequirement:0,totalStorageSize:0}
    this.collections = []
    this.engine = "wiredTiger"
    this.compression = "snappy"
    this.shards = 1
    this.oplog = 50
    this.compute()
  }

  /**
   ** @brief Add a new collection to the set and recompute
   */
  public addCollection(col: MongoCollection) {
    col.validate()
    col.service = this;
    this.collections.push(col)
    this.compute()
  }

  /**
   ** @brief Compute all metrics from input information
   ** @returns
   */
  public compute() {
    var service = this
    this.collections.forEach(function(col) {
      col.compute(service)
    });
    this.storageSize = this.collections.map(function(col) { return col.storageSize}).reduce(function(previousValue, currentValue, currentIndex, array) {
      return previousValue + currentValue
    }, 0)
    this.dataSize = this.collections.map(function(col) { return col.dataSize}).reduce(function(previousValue, currentValue, currentIndex, array) {
      return previousValue + currentValue
    }, 0)
    this.indexSize = this.collections.map(function(col) { return col.indexSize}).reduce(function(previousValue, currentValue, currentIndex, array) {
      return previousValue + currentValue
    }, 0)
    this.memoryRequirement = this.collections.map(function(col) { return col.memoryRequirement}).reduce(function(previousValue, currentValue, currentIndex, array) {
      return previousValue + currentValue
    }, 0)
    this.numberOfIndexes = this.collections.map(function(col) { return col.indexes.length}).reduce(function(previousValue, currentValue, currentIndex, array) {
      return previousValue + currentValue
    }, 0)
    this.numberOfDocument = this.collections.map(function(col) { return col.numberOfDocument}).reduce(function(previousValue, currentValue, currentIndex, array) {
      return previousValue + currentValue
    }, 0)

    // Adding the oplog information
    this.storageSize += this.getCompressedSize(this.oplog * 1024 * 1024 * 1024 * this.shards)
    this.dataSize += this.oplog * 1024 * 1024 * 1024 * this.shards

    this.computeSummary();
  }

  /**
   ** @brief formating nicely size
   ** @input size size in byte to format
   ** @return nicely formatted string
   */
  public formatSize(size: int) {
    if (size < 1024) {
      return (Number(size).toFixed(0)) + " bytes"
    }
    if (size < (1024 * 1024)) {
      return Number(((size / 1024))).toFixed(2) + " kbytes"
    }
    if (size < (1024 * 1024 * 1024)) {
      return Number(((size / (1024 * 1024)))).toFixed(2) + " mbytes"
    }
    if (size < (1024 * 1024 * 1024 * 1024)) {
      return Number(((size / (1024 * 1024 * 1024)))).toFixed(2) + " gbytes"
    }
    return Number(((size / (1024 * 1024 * 1024 * 1024)))).toFixed(2) + " tbytes"
  }

  /**
   ** @brief return the MMAPv1 padded size
   ** for doc less than 2MB, this is the nearest power of 2
   ** for other block, this the next 2MB increment
   */
  public getPaddedSize(size: int) {
    if (size < (2 * 1024 * 1024)) { //
      return Math.pow(2 ,(Math.log2(size) | 0) + 1) | 0
    } else {
      return (((size / (2 * 1024 * 1024)) | 0) + 1) * (2 * 1024 * 1024) | 0
    }
  }

  /**
   ** @brief return the size according to the block compressor used
   ** Currently hard coded, snappy / 3, zlib / 4, none / 0.95 (overhead)
   ** Currently hard coded, snappy / 3, zlib / 4, zlib / 5, none / 0.95 (overhead)
   ** @returns
   */
  public getCompressedSize(size: int) {
    if (this.engine != "wiredTiger") {
      return size
    } else {
      if (this.compression == "snappy") { return Number(Number(size / 3).toFixed(0)) }
      else if (this.compression == "zlib") { return Number(Number(size / 4).toFixed(0)) }
      else if (this.compression == "zstd") { return Number(Number(size / 5).toFixed(0)) }
      else { return Number(Number(size * 1.05).toFixed(0)) }
    }
  }

  public getShards() {
    let res = [];
    for (let i = 0; i < this.shards; i++) {
      res.push({id: i})
    }
    return res;
  }

  public serialize() {
    let res = {}
    let toSave = ['collections', 'engine', 'compression', 'oplog']

    for (let attr in  this) {
      if (toSave.indexOf(attr) != -1) {
        res[attr] = serializeAttribute(this[attr])
      }
    }

    return res
  }

  public deserialize(object) {
    let toSave = ['engine', 'compression', 'oplog']

    for (let attr in  object) {
      if (toSave.indexOf(attr) != -1) {
        this[attr] = deserializeAttribute(object[attr])
      }
    }

    for (let i in object.collections) {
      let col = new MongoCollection()
      col.service = this
      col.deserialize(object.collections[i])
      this.collections.push(col)
    }
  }


  get shards() {
    return this._shards
  }
  set shards(n) {
    this._shards = n
    this.compute()
  }
  get engine() {
    return this._engine
  }
  set engine(n) {
    this._engine = n
    this.compute()
  }
  get oplog() {
    return this._oplog
  }
  set oplog(n) {
    this._oplog = n
    this.compute()
  }
  get compression() {
    return this._compression
  }
  set compression(n) {
    this._compression = n
    this.compute()
  }
  computeSummary() {
    if(this.collections.length > 0) {
      this.summary.totalDocuments = this.collections
      .map((a) => a.numberOfDocument)
      .reduce(function (a, b) {
        return a + b;
      });

      this.summary.totalDocumentsInMemory = this.collections
      .map((a) => a.numberOfDocumentInMemory)
      .reduce(function (a, b) {
        return a + b;
      });

      this.summary.totalIndexes = this.collections
      .map((a) => a.indexes.length)
      .reduce(function (a, b) {
        return a + b;
      });

      this.summary.totalAverageDocumentSize = this.collections
      .map((a) => a.averageDocumentSize)
      .reduce(function (a, b) {
        return a + b;
      });

      this.summary.totalDataSize = this.collections
      .map((a) => a.dataSize)
      .reduce(function (a, b) {
        return a + b;
      });

      this.summary.totalIndexSize = this.collections
      .map((a) => a.indexSize)
      .reduce(function (a, b) {
        return a + b;
      });

      this.summary.totalStorageSize = this.collections
      .map((a) => a.storageSize)
      .reduce(function (a, b) {
        return a + b;
      });

      this.summary.totalMemoryRequirement = this.collections
      .map((a) => a.memoryRequirement)
      .reduce(function (a, b) {
        return a + b;
      });
    }
  }
}


export function toBson() {
  let result = {}
  for (let attr in this) {
    if (typeof this[attr] == 'number') {
      result[attr] = { _bsontype: 'Double', number: this[attr] }
    } else if (this[attr] === "$id") {
      result[attr]  = { _bsontype: 'ObjectID', id: this[attr] }
    } else if (this[attr] === "$date" || this[attr] === "$timestamp") {
      result[attr]  = { _bsontype: 'Timestamp', id: this[attr] }
    } else {
      result[attr] = this[attr]
    }
  }

  return result
}

export function serializeAttribute(value) {
  if (typeof value == 'object' && value.serialize != undefined) {
    return value.serialize()
  } else if (typeof value == 'object' && value.length != undefined) {
    return value.map(function(e) { return serializeAttribute(e) })
  } else if (typeof value == 'function') {
    return null
  }

  return value
}

export function deserializeAttribute(value) {
  if (typeof value == 'object' && value.deserialize != undefined) {
    return value.deserialize()
  } else if (typeof value == 'object' && value.length != undefined) {
    return value.map(function(e) { return deserializeAttribute(e) })
  } else if (typeof value == 'function') {
    return null
  }

  return value
}

interface Summary {
  totalDocuments:number;
  totalDocumentsInMemory: number;
  totalIndexes:number;
  totalAverageDocumentSize:number;

  totalDataSize:number;
  totalIndexSize:number;
  totalStorageSize:number;
  totalMemoryRequirement:number;
}
