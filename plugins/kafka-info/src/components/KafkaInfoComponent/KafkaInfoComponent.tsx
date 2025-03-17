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
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Menu,
  IconButton,
  ListItemSecondaryAction,
  Box
} from '@material-ui/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  InfoCard,
} from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
// These will let us get info about our backstage configuration
import { useApi, configApiRef } from '@backstage/core-plugin-api';

const ClusterSelect = ({setCurrentClusterIdx, currentClusterIdx, clusterMap}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (_event: React.MouseEvent<HTMLElement>, index: number) => {
    setCurrentClusterIdx(index);
    setAnchorEl(null);
  }

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
    <List style={{ 
        minHeight: 0,
        padding: 0
     }}>
      <ListItem
        button
        aria-haspopup="true"
        aria-controls="cluster-menu"
        aria-label="Cluster"
        onClick={handleClickListItem}
        style={{
          minHeight: 0,
          padding: 0
        }}
      >
        <IconButton aria-label="Select cluster">
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
        <Box
          textAlign="right"
          style={{ paddingRight: 5 }}
        >
          Cluster:
        </Box>
        <ListItemText secondary={clusterMap[currentClusterIdx].name} />
      </ListItem>
    </List>
    <Menu
      id="cluster-menu"
      keepMounted
      open={Boolean(anchorEl)}
      onClose={handleClose}
      anchorEl={anchorEl}
    >
      {clusterMap.map((cluster, index) => (
        <MenuItem
          key={cluster.name}
          selected={index === currentClusterIdx}
          onClick={(event) => handleMenuItemClick(event, index)}
        >
          {cluster.name}
          </MenuItem>
      ))}
    </Menu>
    </div>
  )
};

export function KafkaInfoComponent() {
  const { entity } = useEntity();
  const title = 'Kafka Information';

  // Get the config object from backstage
  const config = useApi(configApiRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Pull the metric we're going to use to track our lag
  const [lagMetric, _setLagMetric] = useState<string>(config.getString('kafkaInfo.lagMetric'));

  // Set up some state info for the response from the backend
  const [metricResponse, setMetricResponse] = useState<Object>({});
  const [filteredResponse, setFilteredResponse] = useState<Object>({});


  // Get cluster config
  const [clusterMap, _setClusterMap] = useState(config.get('kafkaInfo.clusters'));
  const [currentClusterIdx, setCurrentClusterIdx] = useState(0);

  // Get backend URL from the config
  const [backendUrl, _setBackendUrl] = useState(config.getString('backend.baseUrl'));

  // Get defined consumer group from entity
  const consumerGroup = entity.metadata.annotations?.[KAFKA_INFO_ANNOTATION].split(',') ?? '';

  useEffect(() => {
    const getClusterAttribute = (attribute: string) => clusterMap[currentClusterIdx]?.[attribute] || '';
    const fetchLags = (proxy: string) => {
      setLoading(true);
      // Directly query a prometheus endpoint for metric data
      fetch(`${backendUrl}/api/proxy/${proxy}/api/v1/query?query=${lagMetric}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(response => {
          return response.json();
        })
        .then(text => {
          setMetricResponse(text);
        })
        .catch(err => {
          setError(true);
          console.error('Error fetching topic data:', err);
          setLoading(false);
        });
    };

    fetchLags(getClusterAttribute('proxy'));
  }, [backendUrl, currentClusterIdx, clusterMap, lagMetric]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const filteredGroup = metricResponse.data?.result?.filter((mentry) => {
      return consumerGroup.some(e => { return e === mentry.metric.group });
    });
    if (filteredGroup === "" || filteredGroup === undefined) {
      setError(true);
    }
    setFilteredResponse(filteredGroup);
    setLoading(false);
  }, [consumerGroup, metricResponse]);

  if (loading) {
    return (
      <InfoCard title={title}>
        <Grid>
          <Grid>
            <ClusterSelect setCurrentClusterIdx={setCurrentClusterIdx} currentClusterIdx={currentClusterIdx} clusterMap={clusterMap}/>
          </Grid >
        </Grid>
        <Typography align="center" variant="body1">Loading...</Typography>
      </InfoCard>
    );
  }

  if (error) {
    return (
      <InfoCard title={title}>
            <ClusterSelect setCurrentClusterIdx={setCurrentClusterIdx} currentClusterIdx={currentClusterIdx} clusterMap={clusterMap}/>
            <Typography>Error loading Kafka Topic Information</Typography>
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
    <InfoCard title={title}>
      <Grid>
        <Grid>
          <ClusterSelect setCurrentClusterIdx={setCurrentClusterIdx} currentClusterIdx={currentClusterIdx} clusterMap={clusterMap}/>
        </Grid >
      </Grid>
      <TopicsTable />
    </InfoCard>
  );
}

