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
import { useApi, configApiRef } from '@backstage/core-plugin-api';

// We're largely using kafka-lag-exporter data currently, this helps us parse it
import parsePrometheusTextFormat from 'parse-prometheus-text-format';

export function KafkaInfoComponent() {
  const { entity } = useEntity();
  const title = 'Kafka Information';

  // Get the config object from backstage
  const config = useApi(configApiRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Set up some state info for the response from the backend
  const [metricResponse, setMetricResponse] = useState<String>('');
  const [parsedResponse, setParsedResponse] = useState<Array>([]);

  // Get backend URL from the config
  const backendUrl = config.getString('backend.baseUrl');

  // Get defined consumer group from entity
  const consumerGroup = entity.metadata.annotations?.[KAFKA_INFO_ANNOTATION] ?? '';

  useEffect(() => {
    setLoading(true);
    fetch(`${backendUrl}/api/proxy/kafka-lag/metrics`)
      .then(response => response.text())
      .then(text => {
        setMetricResponse(text);
        setLoading(false);
      })
      .catch(error => {
        setError(true);
        console.error('Error fetching topic data:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const parsed = parsePrometheusTextFormat(metricResponse);
    const filteredMetric = parsed.filter((ent) => ent.name == 'kafka_consumergroup_group_topic_sum_lag')
    const filteredGroup = filteredMetric[0]?.metrics.filter((mentry) => mentry.labels.group == consumerGroup);
    if (filteredGroup) {
      setParsedResponse(filteredGroup);
    }
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
            {parsedResponse.map((ent) => (
              <TableRow key={ent.labels.topic}>
                <TableCell component="th" scope="row">
                  {ent.labels.topic}
                </TableCell>
                <TableCell align="right">{ent.value}</TableCell>
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

