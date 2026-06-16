# Architecture

## Overview

backstage-plugin-kafka-info is a [Backstage][backstage] frontend plugin that displays Kafka
consumer lag information for catalog entities. It queries a [Prometheus][prometheus] instance
through the Backstage proxy to retrieve the `aws_kafka_max_offset_lag_sum` metric, filters
results by consumer group, and renders a table of topics with their current lag values.

The repository is structured as a Yarn workspaces monorepo containing the plugin itself and a
development Backstage application for local testing.

## Directory Structure

```
.
├── plugins/
│   └── kafka-info/              # The plugin package
│       ├── src/
│       │   ├── index.ts          # Public API barrel export
│       │   ├── plugin.ts         # Plugin registration and component extension
│       │   ├── routes.ts         # Route reference definition
│       │   └── components/
│       │       └── KafkaInfoComponent/
│       │           ├── KafkaInfoComponent.tsx   # Main React component
│       │           ├── constants.ts             # Annotation key constant
│       │           └── index.ts                 # Component barrel export
│       └── dev/
│           ├── index.tsx         # Dev app setup with mock entity
│           └── entity.ts         # Mock entity definition for development
├── packages/
│   ├── app/                     # Example Backstage frontend app
│   └── backend/                 # Example Backstage backend
├── examples/                    # Example catalog entities and templates
├── app-config.yaml              # Backstage configuration (includes proxy setup)
└── package.json                 # Root workspace configuration
```

## Key Components

### Plugin Registration (`plugin.ts`)

The plugin is registered with Backstage via `createPlugin` using the ID `kafka-info`. It provides
a single component extension, `EntityKafkaInfoContent`, which lazy-loads the
`KafkaInfoComponent`. The file also exports `isPluginApplicableToEntity`, a predicate that checks
whether a catalog entity has the `kafka-info/consumer-groups` annotation.

### KafkaInfoComponent (`KafkaInfoComponent.tsx`)

The main React component that:

1. Reads the `kafka-info/consumer-groups` annotation from the current entity (supports
   comma-separated multiple groups)
2. Fetches the `aws_kafka_max_offset_lag_sum` Prometheus metric through the Backstage proxy
3. Filters the Prometheus response to include only results matching the entity's consumer groups
4. Renders a table showing each topic and its current consumer lag value

The component uses Backstage's `useEntity` hook for catalog context, `configApiRef` for backend
URL resolution, and `fetchApiRef` for authenticated HTTP requests.

### Constants (`constants.ts`)

Defines the annotation key `kafka-info/consumer-groups` used to associate catalog entities with
Kafka consumer groups.

### Route Reference (`routes.ts`)

Defines a route reference with ID `kafka-info` for Backstage's routing system.

## Data Flow

```
Catalog Entity
  │
  │  annotation: kafka-info/consumer-groups
  │
  ▼
KafkaInfoComponent
  │
  │  GET /api/proxy/kafka-lag/query?query=aws_kafka_max_offset_lag_sum
  │
  ▼
Backstage Proxy (/kafka-lag)
  │
  │  Forwards request with authentication headers
  │
  ▼
Prometheus Server
  │
  │  Returns metric results with group + topic labels
  │
  ▼
KafkaInfoComponent
  │
  │  Filters by consumer group, extracts topic + lag
  │
  ▼
Table UI (Topics × Current Lag)
```

## Integration Points

### Backstage Catalog

Entities opt in to the plugin by adding the `kafka-info/consumer-groups` annotation to their
`catalog-info.yaml`. The annotation value is a comma-separated list of Kafka consumer group
names.

### Backstage Proxy

The plugin requires a proxy endpoint configured at `/kafka-lag` in `app-config.yaml`. This
endpoint forwards requests to a Prometheus server and injects any required authentication
headers (e.g., a bearer token).

### Static Plugin Integration

For static (compiled-in) usage, import `EntityKafkaInfoContent` and
`isPluginApplicableToEntity` from the plugin package and mount them on the entity page.

### Dynamic Plugin Integration

The plugin supports [Janus IDP][janus-idp] dynamic plugin loading via `janus-cli
package export-dynamic-plugin`. When used as a dynamic plugin, it is configured through the
`dynamicPlugins` section in `app-config.yaml`, specifying mount points and layout options.

[backstage]: https://backstage.io
[janus-idp]: https://janus-idp.io
[prometheus]: https://prometheus.io
