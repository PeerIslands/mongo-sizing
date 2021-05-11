export class MongoCalculatorService {
  public _storageRawDataSizeGB: number;
  public _storageAtRestSize: number;
  public _storageIndexesSize: number;
  public _storageLogsSize: number;
  public _storageTotalRequired: number;

  public _ramHotDataSizeGB: number;
  public _ramSetAndIndexSize: number;
  public _ramCacheSize: number;
  public _ramTotalRequired: number;

  public _cpuPeakOpsPerSecond: number;
  public _cpuTotalRequired: number;

  public _iopsMinTotalRequired: number;
  public _iopsMaxTotalRequired: number;

  public _shards: Array<any>;

  public _percentageStorageAtRest: number;
  public _percentageStorageIndexes: number;
  public _percentageStorageLogs: number;
  public _percentageRamSetAndIndex: number;
  public _percentageRamCacheSize: number;
  public _maxWorkloadEachCpu: number;
  public _percentageIopsMin: number;
  public _percentageIopsMax: number;

  public _copyRamHotDataSizeGBFromStorageRawDataSizeGB: boolean;

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
    this.shards = this.atlasClusterReference;
    this._storageRawDataSizeGB =
      this._storageAtRestSize =
      this._storageIndexesSize =
      this._storageLogsSize =
      this._storageTotalRequired =
        0;
    this._ramHotDataSizeGB =
      this._ramSetAndIndexSize =
      this._ramCacheSize =
      this._ramTotalRequired =
        0;
    this._cpuPeakOpsPerSecond = this._cpuTotalRequired = 0;
    this._iopsMinTotalRequired = this._iopsMaxTotalRequired = 0;
    this._copyRamHotDataSizeGBFromStorageRawDataSizeGB = true;

    this._percentageStorageAtRest = 33;
    this._percentageStorageIndexes = 25;
    this._percentageStorageLogs = 25;
    this._percentageRamSetAndIndex = 0.2;
    this._percentageRamCacheSize = 0.2;
    this._maxWorkloadEachCpu = 4000;
    this._percentageIopsMin = 5;
    this._percentageIopsMax = 80;

    this.compute();
  }

  /**
   ** @brief Compute all metrics from input information
   ** @returns
   */
  public compute() {
    this.computeStorage();
    this.computeRam();
    this.computeCpuAndIops();
    this.computeShards();
  }

  private computeStorage() {
    this.storageAtRestSize = +Number(
      (this.fromGigabytesToBytes(this.storageRawDataSizeGB) *
        this.percentageStorageAtRest) /
        100
    ).toFixed(this.decimalSize);
    this.storageIndexesSize = +Number(
      (this.storageAtRestSize * this.percentageStorageIndexes) / 100
    ).toFixed(this.decimalSize);
    this.storageLogsSize = +Number(
      (this.storageAtRestSize * this.percentageStorageLogs) / 100
    ).toFixed(this.decimalSize);
    this.storageTotalRequired = +Number(
      this.storageAtRestSize + this.storageIndexesSize + this.storageLogsSize
    ).toFixed(this.decimalSize);
  }

  private computeRam() {
    this.ramSetAndIndexSize = +Number(
      (this.fromGigabytesToBytes(this.ramHotDataSizeGB) *
        this.percentageRamSetAndIndex) /
        100
    ).toFixed(this.decimalSize);
    this.ramCacheSize = +Number(
      (this.fromGigabytesToBytes(this.ramHotDataSizeGB) *
        this.percentageRamCacheSize) /
        100
    ).toFixed(this.decimalSize);
    this.ramTotalRequired = +Number(
      this.ramSetAndIndexSize + this.ramCacheSize
    ).toFixed(this.decimalSize);
  }

  private computeCpuAndIops() {
    this.cpuTotalRequired =
      this.cpuPeakOpsPerSecond === 0 || this.maxWorkloadEachCpu === 0
        ? 0
        : Math.ceil(this.cpuPeakOpsPerSecond / this.maxWorkloadEachCpu);
    this.iopsMinTotalRequired = +Number(
      (this.cpuPeakOpsPerSecond * this.percentageIopsMin) / 100
    ).toFixed(this.decimalSize);
    this.iopsMaxTotalRequired = +Number(
      (this.cpuPeakOpsPerSecond * this.percentageIopsMax) / 100
    ).toFixed(this.decimalSize);
  }

  private computeShards() {
    this.shards = this.shards.map((item) => {
      item.shardsByStorage =
        this.storageTotalRequired > 0
          ? +Number(
              this.fromBytesToGigabytes(this.storageTotalRequired) /
                item.maxDiskStorageGb
            ).toFixed(1)
          : 0;
      item.shardsByRam =
        this.ramTotalRequired > 0
          ? +Number(
              this.fromBytesToGigabytes(this.ramTotalRequired) / item.ramGb
            ).toFixed(this.decimalSize)
          : 0;
      item.shardsByCore =
        this.cpuTotalRequired > 0
          ? +Number(this.cpuTotalRequired / item.vCPUs).toFixed(
              this.decimalSize
            )
          : 0;
      item.shardsByIops =
        this.iopsMaxTotalRequired > 0
          ? +Number(this.iopsMaxTotalRequired / item.maxIops).toFixed(
              this.decimalSize
            )
          : 0;
      item.shardsTotalRequired = Math.ceil(
        Math.max(
          item.shardsByStorage,
          item.shardsByRam,
          item.shardsByCore,
          item.shardsByIops
        )
      );

      return item;
    });
  }

  public fromGigabytesToBytes(value: number) {
    return Number(value) * (1024 * 1024 * 1024);
  }

  public fromBytesToGigabytes(value: number) {
    return Number(value) / (1024 * 1024 * 1024);
  }

  get storageRawDataSizeGB() {
    return this._storageRawDataSizeGB;
  }
  set storageRawDataSizeGB(n) {
    this._storageRawDataSizeGB = isNaN(n) ? 0 : Number(n);
    if (this.copyRamHotDataSizeGBFromStorageRawDataSizeGB) {
      this._ramHotDataSizeGB = this._storageRawDataSizeGB;
    }
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

  get ramHotDataSizeGB() {
    return this._ramHotDataSizeGB;
  }
  set ramHotDataSizeGB(n) {
    this._ramHotDataSizeGB = isNaN(n) ? 0 : Number(n);
    this.compute();
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
    this._cpuPeakOpsPerSecond = isNaN(n) ? 0 : Number(n);
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

  get shards() {
    return this._shards;
  }
  set shards(n) {
    this._shards = n;
  }

  get percentageStorageAtRest() {
    return this._percentageStorageAtRest;
  }
  set percentageStorageAtRest(n) {
    this._percentageStorageAtRest = isNaN(n) ? 0 : Number(n);
    this.compute();
  }
  get percentageStorageIndexes() {
    return this._percentageStorageIndexes;
  }
  set percentageStorageIndexes(n) {
    this._percentageStorageIndexes = isNaN(n) ? 0 : Number(n);
    this.compute();
  }
  get percentageStorageLogs() {
    return this._percentageStorageLogs;
  }
  set percentageStorageLogs(n) {
    this._percentageStorageLogs = isNaN(n) ? 0 : Number(n);
    this.compute();
  }
  get percentageRamSetAndIndex() {
    return this._percentageRamSetAndIndex;
  }
  set percentageRamSetAndIndex(n) {
    this._percentageRamSetAndIndex = isNaN(n) ? 0 : Number(n);
    this.compute();
  }
  get percentageRamCacheSize() {
    return this._percentageRamCacheSize;
  }
  set percentageRamCacheSize(n) {
    this._percentageRamCacheSize = isNaN(n) ? 0 : Number(n);
    this.compute();
  }
  get maxWorkloadEachCpu() {
    return this._maxWorkloadEachCpu;
  }
  set maxWorkloadEachCpu(n) {
    this._maxWorkloadEachCpu = isNaN(n) ? 0 : Number(n);
    this.compute();
  }
  get percentageIopsMin() {
    return this._percentageIopsMin;
  }
  set percentageIopsMin(n) {
    this._percentageIopsMin = isNaN(n) ? 0 : Number(n);
    this.compute();
  }
  get percentageIopsMax() {
    return this._percentageIopsMax;
  }
  set percentageIopsMax(n) {
    this._percentageIopsMax = isNaN(n) ? 0 : Number(n);
    this.compute();
  }
  get copyRamHotDataSizeGBFromStorageRawDataSizeGB() {
    return this._copyRamHotDataSizeGBFromStorageRawDataSizeGB;
  }
  set copyRamHotDataSizeGBFromStorageRawDataSizeGB(n) {
    this._copyRamHotDataSizeGBFromStorageRawDataSizeGB = Boolean(n);
    if (this._copyRamHotDataSizeGBFromStorageRawDataSizeGB) {
      this._ramHotDataSizeGB = this._storageRawDataSizeGB;
      this.compute();
    }
  }
}
