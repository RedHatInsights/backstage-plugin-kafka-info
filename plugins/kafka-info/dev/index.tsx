import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { kafkaInfoPlugin, KafkaInfoPage } from '../src/plugin';

createDevApp()
  .registerPlugin(kafkaInfoPlugin)
  .addPage({
    element: <KafkaInfoPage />,
    title: 'Root Page',
    path: '/kafka-info',
  })
  .render();
