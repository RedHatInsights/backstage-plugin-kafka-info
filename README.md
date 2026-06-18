# backstage-plugin-kafka-info

A [Backstage][backstage] frontend plugin that displays Kafka consumer lag information for catalog
entities. It queries a [Prometheus][prometheus] instance through the Backstage proxy to show active
topics and their current consumer lag in a table.

## Features

- Displays Kafka consumer lag per topic for annotated catalog entities
- Queries the `aws_kafka_max_offset_lag_sum` Prometheus metric via the Backstage proxy
- Supports multiple consumer groups per entity (comma-separated annotation)
- Renders as an entity page card (overview) or a dedicated tab
- Works as both a static and [dynamic plugin][janus-idp] (via `janus-cli export-dynamic-plugin`)

## Prerequisites

- [Node.js][node] 22 or 24
- [Yarn][yarn] 4.4.1+
- A running [Backstage][backstage] instance (1.48.0+)
- A Prometheus server exposing the `aws_kafka_max_offset_lag_sum` metric (e.g., via
  [kafka-exporter][kafka-exporter] or [kafka-lag-exporter][kafka-lag-exporter])

## Installation

```sh
yarn add @redhatinsights/backstage-plugin-kafka-info
```

## Configuration

### Proxy

Add a proxy endpoint in `app-config.yaml` to forward requests to the Prometheus server:

```yaml
proxy:
  endpoints:
    '/kafka-lag':
      target: 'https://your-prometheus-server/'
      allowedHeaders: ['Authorization']
      headers:
        Authorization: "Bearer ${PROMETHEUS_TOKEN}"
```

### Entity Annotation

Add the `kafka-info/consumer-groups` annotation to any catalog entity that should display Kafka
lag information. The value is a comma-separated list of consumer group names:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    kafka-info/consumer-groups: my-consumer-group,another-group
spec:
  type: service
  owner: my-team
```

### Static Plugin Usage

Import the plugin component and predicate, then mount them on the entity page:

```tsx
import {
  EntityKafkaInfoContent,
  isPluginApplicableToEntity,
} from '@redhatinsights/backstage-plugin-kafka-info';
```

### Dynamic Plugin Usage

To use as a dynamic plugin, add the following to the `dynamicPlugins` section of
`app-config.yaml`:

```yaml
dynamicPlugins:
  frontend:
    redhatinsights.backstage-plugin-kafka-info:
      mountPoints:
        - mountPoint: entity.page.overview/cards
          importName: EntityKafkaInfoContent
          config:
            layout:
              gridColumnEnd:
                lg: "span 4"
                md: "span 4"
                xs: "span 4"
```

## Usage

Once configured, navigate to any catalog entity that has the `kafka-info/consumer-groups`
annotation. The plugin renders a "Kafka Information" card showing a table of topics and their
current consumer lag values.

## Development

This repository is a Yarn workspaces monorepo with an example Backstage app for local development.

### Install dependencies

```sh
yarn install
```

### Start the development server

```sh
yarn start
```

### Build all packages

```sh
yarn build:all
```

### Run tests

```sh
yarn test
yarn test:all    # with coverage
```

### Lint

```sh
yarn lint
yarn lint:all    # all files (not just changed since origin/main)
```

### Type check

```sh
yarn tsc
```

### Check formatting

```sh
yarn prettier:check
```

### Build dynamic plugin

```sh
yarn export-dynamic
```

## Contributing

See [CONTRIBUTING.md][contributing] for guidelines on how to contribute to this project.

## License

This project is licensed under the [Apache License 2.0][license].

[backstage]: https://backstage.io
[contributing]: ./CONTRIBUTING.md
[janus-idp]: https://janus-idp.io
[kafka-exporter]: https://github.com/danielqsj/kafka_exporter
[kafka-lag-exporter]: https://github.com/seglo/kafka-lag-exporter
[license]: https://www.apache.org/licenses/LICENSE-2.0
[node]: https://nodejs.org
[prometheus]: https://prometheus.io
[yarn]: https://yarnpkg.com
