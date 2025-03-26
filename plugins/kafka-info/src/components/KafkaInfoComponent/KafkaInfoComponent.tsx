import React, { useState } from 'react';
import { KAFKA_INFO_ANNOTATION } from './constants';
import {
  Typography,
} from '@material-ui/core';
import {
  InfoCard,
  ResponseErrorPanel,
  Select,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
// These will let us get info about our backstage configuration
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import useAsync from 'react-use/esm/useAsync';
import { kafkaInfoPlugin } from '../../plugin';

const ClusterSelect = ({setCurrentClusterIdx, currentClusterIdx, clusterMap}) => {
  const items = clusterMap.map((cluster: {}, idx: number) => {
    return {
      'label': cluster.name,
      'value': idx
    }
  })

  return (
    <Select
      onChange={(SelectedItems) => {setCurrentClusterIdx(SelectedItems)}}
      label="Cluster"
      items={
        items
      }
      native
      selected={currentClusterIdx}
    />
  )
};

interface TopicTableProps {
  topics?: TopicList;
  message?: string;
  loading?: boolean;
}

interface TopicMetric {
  kind: 'TopicMetric';
  metric: {
    group: string,
    topic: string
  };
  value: [];
}

interface TopicList {
  kind: 'TopicList';
  page?: number;
  size?: number;
  total?: number;
  items?: TopicMetric[];
  errorMsg?: string;
}

const TopicTable = ({
  topics,
  message,
  loading,
}: TopicTableProps) => {
  if (message) {
    return (
      <InfoCard title="Kafka Info">
        <Typography variant="body1">{"Error fetching topic data: ${message}"}</Typography>
      </InfoCard>
    )
  }

  if (!topics || !topics.items || topics.items.length ===0) {
    return (
      <InfoCard title="Kafka Info">
        <Typography variant="body1">Error fetching topic data: No Topic Data</Typography>
      </InfoCard>
    )
  }

  const columns: TableColumn[] = [
    { title: 'Topic', field: 'topic_id'},
    { title: 'Current Lag', field: 'topic_lag'},
  ];

  const data = topics.items.map(inc => {
    return {
      topic_id: inc.metric.topic,
      topic_lag: inc.value.at(-1)
    };
  });

  return (
    <InfoCard>
      <Table
        title="Topic Lag"
        options={{
          search: false,
          paging: true,
          pageSize: 5,
          padding: 'dense',
        }}
        columns={columns}
        data={data}
        isLoading={loading}
      />
    </InfoCard>
  );
};

export function KafkaInfoComponent() {
  const { entity } = useEntity();

  // Get the config object from backstage
  const config = useApi(configApiRef);

  // Set up backstage fetchApi for authenticated routes
  const fetchApi = useApi(fetchApiRef);

  // Get cluster config
  const [clusterMap, _setClusterMap] = useState(config.get('kafkaInfo.clusters'));
  const [currentClusterIdx, setCurrentClusterIdx] = useState(0);

  // Get defined consumer group from entity
  const consumerGroup = entity.metadata.annotations?.[KAFKA_INFO_ANNOTATION].split(',') ?? '';

  const { value, loading, error } = useAsync(async (): Promise<
    TopicList | string
  > => {
    const getClusterAttribute = (attribute: string) => clusterMap[currentClusterIdx]?.[attribute] || '';

    const query = `sum(${config.getString('kafkaInfo.lagMetric')}{group='${consumerGroup}'}) by (group, topic)`

    const topicList = await fetchApi.fetch(
      `${config.getString('backend.baseUrl')}/api/proxy/${getClusterAttribute('proxy')}/api/v1/query?query=${query}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      },
    ).catch(e => e)
     .then(resp => resp.json())
     .then(out => {
      return {
        "items": out.data.result
      };
     })

    return topicList as Promise<TopicList>;
  }, [currentClusterIdx]);

  if (loading) {
    return <TopicTable loading />
  }

  if (error) {
    return (
      <ResponseErrorPanel error={error} />
    )
  }

  if (!value) {
    return (
      <ResponseErrorPanel
        error={{
          name: "Kafka Info",
          message: "Unspecified Error"
        }}
      />
    )
  }

  if (typeof value === 'string') {
    return (
      <TopicTable
        message={value}
      />
    )
  }

  return (
    <InfoCard title="Kafka Info">
      <ClusterSelect 
        setCurrentClusterIdx={setCurrentClusterIdx}
        currentClusterIdx={currentClusterIdx}
        clusterMap={clusterMap}
      />
      <TopicTable
        topics={value}
      />
    </InfoCard>
  );
}

