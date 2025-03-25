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
  Typography
} from '@material-ui/core';
import {
  InfoCard,
} from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
// These will let us get info about our backstage configuration
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';

export function KafkaInfoComponent() {
  const { entity } = useEntity();
  const title = 'Kafka Information';

  // Get the config object from backstage
  const config = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Set up some state info for the response from the backend
  const [metricResponse, setMetricResponse] = useState<Object>({});
  const [filteredResponse, setFilteredResponse] = useState<Object>({});

  // Get backend URL from the config
  const backendUrl = config.getString('backend.baseUrl');

  // Get defined consumer group from entity
  const consumerGroup = entity.metadata.annotations?.[KAFKA_INFO_ANNOTATION].split(',') ?? '';

  useEffect(() => {
    setLoading(true);
    // Directly query a prometheus endpoint for metric data
    fetchApi.fetch(`${backendUrl}/api/proxy/kafka-lag/query?query=aws_kafka_max_offset_lag_sum`)
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
  }, []);

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
    <InfoCard title={title} noPadding>
      <TopicsTable />
    </InfoCard>
  );
}

