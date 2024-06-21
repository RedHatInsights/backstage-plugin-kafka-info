import {
  createPlugin,
  createComponentExtension,
} from '@backstage/core-plugin-api';

import { Entity } from '@backstage/catalog-model';

import { KAFKA_INFO_ANNOTATION } from './components/KafkaInfoComponent/constants';

export const isPluginApplicableToEntity = (entity: Entity) =>
  Boolean(entity.metadata.annotations?.[KAFKA_INFO_ANNOTATION]);

export const kafkaInfoPlugin = createPlugin({
  id: 'kafka-info',
});

export const EntityKafkaInfoContent = kafkaInfoPlugin.provide(
  createComponentExtension({
    name: 'EntityKafkaInfoContent',
    component: {
      lazy: () => import('./components/KafkaInfoComponent').then(m => m.KafkaInfoComponent),
    },
  }),
);
