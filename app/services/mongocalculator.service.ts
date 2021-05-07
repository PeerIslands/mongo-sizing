export class MongoCalculatorService {
  public _storageRawDataSize: number;
  public _storageAtRestSize: number;
  public _storageIndexesSize: number;
  public _storageLogsSize: number;
  public _storageTotalRequired: number;

  public _ramHotDataSize: number;
  public _ramSetAndIndexSize: number;
  public _ramCacheSize: number;
  public _ramTotalRequired: number;

  public _cpuPeakOpsPerSecond: number;
  public _cpuTotalRequired: number;

  public _iopsMinTotalRequired: number;
  public _iopsMaxTotalRequired: number;

  public _instanceType: string;

  public _shardsByStorage: number;
  public _shardsByRam: number;
  public _shardsByCore: number;
  public _shardsByIops: number;
  public _shardsTotalRequired: number;

  private percentageStorageAtRest: number = 0.33;
  private percentageStorageIndexes: number = 0.25;
  private percentageStorageLogs: number = 0.25;
  private percentageRamSetAndIndex: number = 0.002;
  private percentageRamCacheSize: number = 0.002;
  private maxWorkloadEachCpu: number = 4000;
  private percentageIopsMin: number = 0.05;
  private percentageIopsMax: number = 0.8;

  private atlasClusterReference = [
    {
      instanceSize: "M30",
      maxDiskStorageGb: 512,
      vCPUs: 2,
      ramGb: 8,
      maxIops: 2300,
      numberOfConnections: 3000,
    },
    {
      instanceSize: "M40",
      maxDiskStorageGb: 1024,
      vCPUs: 4,
      ramGb: 16,
      maxIops: 5000,
      numberOfConnections: 6000,
    },
    {
      instanceSize: "M50",
      maxDiskStorageGb: 4095,
      vCPUs: 8,
      ramGb: 32,
      maxIops: 7500,
      numberOfConnections: 16000,
    },
    {
      instanceSize: "M60",
      maxDiskStorageGb: 4095,
      vCPUs: 16,
      ramGb: 64,
      maxIops: 7500,
      numberOfConnections: 32000,
    },
    {
      instanceSize: "M80",
      maxDiskStorageGb: 4095,
      vCPUs: 32,
      ramGb: 128,
      maxIops: 7500,
      numberOfConnections: 64000,
    },
    {
      instanceSize: "M200",
      maxDiskStorageGb: 4095,
      vCPUs: 64,
      ramGb: 256,
      maxIops: 7500,
      numberOfConnections: 128000,
    },
    {
      instanceSize: "M300",
      maxDiskStorageGb: 4095,
      vCPUs: 48,
      ramGb: 384,
      maxIops: 7500,
      numberOfConnections: 128000,
    },
    {
      instanceSize: "M400",
      maxDiskStorageGb: 4095,
      vCPUs: 64,
      ramGb: 432,
      maxIops: 7500,
      numberOfConnections: 128000,
    },
  ];

  private decimalSize: number = 3;

  constructor() {
    this.storageRawDataSize = this.storageAtRestSize = this.storageIndexesSize = this.storageLogsSize = this.storageTotalRequired = 0;
    this.ramHotDataSize = this.ramSetAndIndexSize = this.ramCacheSize = this.ramTotalRequired = 0;
    this.cpuPeakOpsPerSecond = this.cpuTotalRequired = 0;
    this.iopsMinTotalRequired = this.iopsMaxTotalRequired = 0;
    this.instanceType = "M30";
    this.shardsByStorage = this.shardsByRam = this.shardsByCore = this.shardsByIops = this.shardsTotalRequired = 0;

    this.compute();
  }

  /**
   ** @brief Compute all metrics from input information
   ** @returns
   */
  public compute() {
    if (this.storageRawDataSize > 0) {
      this.computeStorage();
      this.ramHotDataSize = this.storageRawDataSize;
    }
    if (this.ramHotDataSize > 0) {
      this.computeRam();
    }
    if (this.cpuPeakOpsPerSecond > 0) {
      this.computeCpuAndIops();
    }
    if (
      this.storageRawDataSize > 0 &&
      this.ramHotDataSize > 0 &&
      this.cpuPeakOpsPerSecond > 0
    ) {
      this.computeShards();
    }
  }

  private computeStorage() {
    this.storageAtRestSize = +Number(
      this.storageRawDataSize * this.percentageStorageAtRest
    ).toFixed(this.decimalSize);
    this.storageIndexesSize = +Number(
      this.storageAtRestSize * this.percentageStorageIndexes
    ).toFixed(this.decimalSize);
    this.storageLogsSize = +Number(
      this.storageAtRestSize * this.percentageStorageLogs
    ).toFixed(this.decimalSize);
    this.storageTotalRequired = +Number(
      this.storageAtRestSize + this.storageIndexesSize + this.storageLogsSize
    ).toFixed(this.decimalSize);
  }

  private computeRam() {
    this.ramSetAndIndexSize = +Number(
      this.ramHotDataSize * this.percentageRamSetAndIndex
    ).toFixed(this.decimalSize);
    this.ramCacheSize = +Number(
      this.ramHotDataSize * this.percentageRamCacheSize
    ).toFixed(this.decimalSize);
    this.ramTotalRequired = +Number(
      this.ramSetAndIndexSize + this.ramCacheSize
    ).toFixed(this.decimalSize);
  }

  private computeCpuAndIops() {
    this.cpuTotalRequired = Math.round(
      this.cpuPeakOpsPerSecond / this.maxWorkloadEachCpu
    );
    this.iopsMinTotalRequired = +Number(
      this.cpuPeakOpsPerSecond * this.percentageIopsMin
    ).toFixed(this.decimalSize);
    this.iopsMaxTotalRequired = +Number(
      this.cpuPeakOpsPerSecond * this.percentageIopsMax
    ).toFixed(this.decimalSize);
  }

  private computeShards() {
    const selectedInstance = this.atlasClusterReference.find(
      (item) => item.instanceSize === this.instanceType
    );
    if (selectedInstance === undefined) {
      return;
    }

    this.shardsByStorage = +Number(
      this.storageTotalRequired / selectedInstance.maxDiskStorageGb
    ).toFixed(1);
    this.shardsByRam = +Number(
      this.ramTotalRequired / selectedInstance.ramGb
    ).toFixed(1);
    this.shardsByCore = +Number(
      this.cpuTotalRequired / selectedInstance.vCPUs
    ).toFixed(1);
    this.shardsByIops = +Number(
      this.iopsMaxTotalRequired / selectedInstance.maxIops
    ).toFixed(1);
    this.shardsTotalRequired = Math.max(
      this.shardsByStorage,
      this.shardsByRam,
      this.shardsByCore,
      this.shardsByIops
    );
  }

  public getInstanceTypes() {
    return this.atlasClusterReference.map((item) => item.instanceSize);
  }

  get storageRawDataSize() {
    return this._storageRawDataSize;
  }
  set storageRawDataSize(n) {
    this._storageRawDataSize = n;
    this.compute();
  }
  get storageAtRestSize() {
    return this._storageAtRestSize;
  }
  set storageAtRestSize(n) {
    this._storageAtRestSize = n;
  }
  get storageIndexesSize() {
    return this._storageIndexesSize;
  }
  set storageIndexesSize(n) {
    this._storageIndexesSize = n;
  }
  get storageLogsSize() {
    return this._storageLogsSize;
  }
  set storageLogsSize(n) {
    this._storageLogsSize = n;
  }
  get storageTotalRequired() {
    return this._storageTotalRequired;
  }
  set storageTotalRequired(n) {
    this._storageTotalRequired = n;
  }

  get ramHotDataSize() {
    return this._ramHotDataSize;
  }
  set ramHotDataSize(n) {
    this._ramHotDataSize = n;
  }
  get ramSetAndIndexSize() {
    return this._ramSetAndIndexSize;
  }
  set ramSetAndIndexSize(n) {
    this._ramSetAndIndexSize = n;
  }
  get ramCacheSize() {
    return this._ramCacheSize;
  }
  set ramCacheSize(n) {
    this._ramCacheSize = n;
  }
  get ramTotalRequired() {
    return this._ramTotalRequired;
  }
  set ramTotalRequired(n) {
    this._ramTotalRequired = n;
  }

  get cpuPeakOpsPerSecond() {
    return this._cpuPeakOpsPerSecond;
  }
  set cpuPeakOpsPerSecond(n) {
    this._cpuPeakOpsPerSecond = n;
    this.compute();
  }
  get cpuTotalRequired() {
    return this._cpuTotalRequired;
  }
  set cpuTotalRequired(n) {
    this._cpuTotalRequired = n;
  }

  get iopsMinTotalRequired() {
    return this._iopsMinTotalRequired;
  }
  set iopsMinTotalRequired(n) {
    this._iopsMinTotalRequired = n;
  }
  get iopsMaxTotalRequired() {
    return this._iopsMaxTotalRequired;
  }
  set iopsMaxTotalRequired(n) {
    this._iopsMaxTotalRequired = n;
  }

  get instanceType() {
    return this._instanceType;
  }
  set instanceType(n) {
    this._instanceType = n;
    this.compute();
  }
  get shardsByStorage() {
    return this._shardsByStorage;
  }
  set shardsByStorage(n) {
    this._shardsByStorage = n;
  }
  get shardsByRam() {
    return this._shardsByRam;
  }
  set shardsByRam(n) {
    this._shardsByRam = n;
  }
  get shardsByCore() {
    return this._shardsByCore;
  }
  set shardsByCore(n) {
    this._shardsByCore = n;
  }
  get shardsByIops() {
    return this._shardsByIops;
  }
  set shardsByIops(n) {
    this._shardsByIops = n;
  }
  get shardsTotalRequired() {
    return this._shardsTotalRequired;
  }
  set shardsTotalRequired(n) {
    this._shardsTotalRequired = n;
  }
}
