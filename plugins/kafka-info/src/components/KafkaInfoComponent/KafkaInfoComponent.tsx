import React, { useState, useEffect } from 'react';
import { KAFKA_INFO_ANNOTATION } from './constants';
import {
  Paper,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Grid,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
} from '@material-ui/core';
import {
  InfoCard,
} from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
// These will let us get info about our backstage configuration
import { useApi, configApiRef } from '@backstage/core-plugin-api';

const clusterMap = [
  stage: {
    proxy: `kafka-lag-stage`,
    name: 'Stage',
    token: '${STAGE_PROMETHEUS_TOKEN}',
  },
  prod: {
    proxy: `kafka-lag-prod`,
    name: 'Prod',
    token: '${PROD_PROMETHEUS_TOKEN}',
  },
];

const getClusterAttribute = (cluster, attribute) => clusterMap[cluster]?.[attribute] || '';

export function KafkaInfoComponent() {
  const { entity } = useEntity();
  const title = 'Kafka Information';

  // Get the config object from backstage
  const config = useApi(configApiRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentCluster, setCurrentCluster] = useState(clusterMap[0]);

  // Set up some state info for the response from the backend
  const [metricResponse, setMetricResponse] = useState<Object>({});
  const [filteredResponse, setFilteredResponse] = useState<Object>({});

  // Get backend URL from the config
  const backendUrl = config.getString('backend.baseUrl');

  // Get defined consumer group from entity
  const consumerGroup = entity.metadata.annotations?.[KAFKA_INFO_ANNOTATION].split(',') ?? '';

  const fetchLags = (proxy, token) => {
    setLoading(true);
    // Directly query a prometheus endpoint for metric data
    fetch(`${backendUrl}/api/proxy/${proxy}/query?query=aws_kafka_sum_offset_lag_sum`, {
      method: "GET", 
      headers: {"Authorization": `Bearer ${token}`, 
      "Content-Type": "application/json" 
      }
    })
      .then(response => {
        return response.json();
      })
      .then(text => {
        setMetricResponse(text);
      })
      .catch(error => {
        setError(true);
        console.error('Error fetching topic data:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLags(getClusterAttribute(currentCluster, 'proxy'));
  }, [currentCluster]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const filteredGroup = metricResponse.data?.result?.filter((mentry) => {
      return consumerGroup.some(e => { return e === mentry.metric.group });
    });
    if (filteredGroup == "" || filteredGroup === undefined) {
      setError(true);
    }
    setFilteredResponse(filteredGroup);
    setLoading(false);
  }, [metricResponse]);

  if (loading) {
    return (
      <InfoCard title={title}>
        <Typography align="center" variant="body1">Loading...</Typography>
      </InfoCard>
    );
  }

  if (error) {
    return (
      <InfoCard title={title}>
        <Typography align="center" variant="body1">
          Error loading {title}.
        </Typography>
      </InfoCard>
    );
  }

  const handleClusterChange = (event) => {
    const selectedCluster = event.target.value;
    setCurrentCluster(selectedCluster);
  };

  const ClusterSelect = () => (
    <FormControl>
      <InputLabel id="cluster-select-label">Cluster</InputLabel>
      <Select labelId="cluster-select-label" id="cluster-select" value={currentCluster} onChange={handleClusterChange}>
        {clusterMap.map((key) => (
          <MenuItem key={key} value={key}>
            {clusterMap[key].name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const TopicsTable = () => {
    return (
      <TableContainer component={Paper}>
        <Table size="small" aria-label="Topics">
          <TableHead>
            <TableRow>
              <TableCell>Topics</TableCell>
              <TableCell align="right">Current Lag</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResponse?.map((ent) => (
              <TableRow key={ent.metric.topic}>
                <TableCell component="th" scope="row">
                  {ent.metric.topic}
                </TableCell>
                <TableCell align="right">{ent.value[1]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <InfoCard>
      <Grid>
        <Grid>
          <Typography>${title}</Typography>
        </Grid>
        <Grid>
          <ClusterSelect />
        </Grid >
      </Grid>
      <TopicsTable />
    </InfoCard>
  );
}

