export interface Config {
  /** @deepVisibility frontend */
  kafkaInfo: {
    /** @visibility frontend */
    lagMetric: string;
    /** @items.visibility frontend */
    clusters?: {
      /** @visibility frontend */
      proxy?: string;
      /** @visibility frontend */
      name?: string;
      /** @visibility frontend */
      token?: string;
    }[];
  };
}
