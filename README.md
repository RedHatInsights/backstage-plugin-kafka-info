# Kafka Info Dynamic Plugin

This is a development mono-repo for the Kafka Info plugin. This mono-repo was created using @backstage/create-app to provide a backend and frontend for the plugin to integrate with.

You can find the plugin code in `plugins/kafka-info`

## Components

### Entity Page Cards
This plugin provides a basic info card component that can be mounted on a catalog entry page.
* `KafkaInfoComponent`: Shows active topics and and consumer lag for any catalog entry with the appropriate `kafka-info/consumer-groups` annotation.

## Configuration
This plugin requires an instance of seglo/lag-exporter or kafka-exporter and related prometheus server from which it pulls consumer information for annotated entities.

In `app-config.yaml` first add the proxy:

```yaml
proxy:
  endpoints:
    '/kafka-lag': 'https://prometheus_endpoint/'
```

Also in `app-config.yaml` add `redhatinsights.backstage-plugin-kafka-info` and the card component configs into the dynamic plugins section.

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

Finally, for any component where Kafka consumer information is desired, add the annotation `kafka-info/consumer-groups: consumer-group1,consumer-group2`.

## Development
To start the app, run:

```sh
yarn install
yarn dev
```

Before you do, you'll likely want to have catalog entries to see the plugin working on. Check out AppStage for that. 

### Build the Dynamic Plugin
Run `./build` - the packed tarball for the release along with its integrity sha will be generated.

