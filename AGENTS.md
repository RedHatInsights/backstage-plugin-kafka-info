# backstage-plugin-kafka-info

## Project Overview

backstage-plugin-kafka-info is a Backstage frontend plugin that displays Kafka consumer lag
information for catalog entities. It reads the `kafka-info/consumer-groups` annotation from
catalog entities, queries the `aws_kafka_max_offset_lag_sum` Prometheus metric through the
Backstage proxy, and renders a table of topics with their current lag values. The plugin supports
both static integration (compiled into the Backstage app) and dynamic loading via Janus IDP.

## Dependencies

### Runtime

- `@backstage/catalog-model` -- catalog entity types
- `@backstage/core-components` -- Backstage UI primitives (`InfoCard`)
- `@backstage/core-plugin-api` -- plugin registration, API refs (`configApiRef`, `fetchApiRef`)
- `@backstage/plugin-catalog-react` -- `useEntity` hook
- `@backstage/theme` -- Backstage theming
- `@material-ui/core`, `@material-ui/icons` -- Material UI components
- `react-use` -- React utility hooks

### Development

- `@backstage/cli` -- build, lint, test, and dev server tooling
- `@janus-idp/cli` -- dynamic plugin export (`export-dynamic-plugin`)
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/dom` -- testing
- `msw` -- API mocking in tests
- `jest` (v30) -- test runner
- `typescript` (~5.8) -- type checking
- `prettier` -- code formatting

### Build Tools

- Yarn 4.4.1 (Corepack-managed, workspaces)
- `@backstage/cli` handles build, lint, test, and dev server
- `@janus-idp/cli` handles dynamic plugin packaging

## Development Commands

See [README.md][readme] for full details. Key commands:

| Command               | Description                               |
| --------------------- | ----------------------------------------- |
| `yarn install`        | Install dependencies                      |
| `yarn start`          | Start the development server              |
| `yarn build:all`      | Build all packages                        |
| `yarn test`           | Run tests                                 |
| `yarn test:all`       | Run tests with coverage                   |
| `yarn lint`           | Lint changed files (since `origin/main`)  |
| `yarn lint:all`       | Lint all files                            |
| `yarn tsc`            | Type check                                |
| `yarn prettier:check` | Check formatting                          |
| `yarn export-dynamic` | Build the dynamic plugin tarball          |

## Architecture

### Key Files

All paths relative to `plugins/kafka-info/src/`:

- **`index.ts`** -- Public barrel export. Re-exports `kafkaInfoPlugin`,
  `EntityKafkaInfoContent`, and `isPluginApplicableToEntity`.
- **`plugin.ts`** -- Plugin registration via `createPlugin`. Provides the
  `EntityKafkaInfoContent` component extension (lazy-loaded) and the
  `isPluginApplicableToEntity` predicate that checks for the `kafka-info/consumer-groups`
  annotation.
- **`routes.ts`** -- Defines the `rootRouteRef` route reference with ID `kafka-info`.
- **`components/KafkaInfoComponent/KafkaInfoComponent.tsx`** -- Main React component. Reads the
  entity annotation, fetches Prometheus metrics via the Backstage proxy at
  `/api/proxy/kafka-lag/query`, filters by consumer group, and renders a topics/lag table.
- **`components/KafkaInfoComponent/constants.ts`** -- Defines the annotation key constant
  `KAFKA_INFO_ANNOTATION = 'kafka-info/consumer-groups'`.

### Repository Structure

```
plugins/kafka-info/    # The plugin package
packages/app/          # Example Backstage frontend app
packages/backend/      # Example Backstage backend
examples/              # Example catalog entities and templates
```

### How It Works

1. A catalog entity includes the `kafka-info/consumer-groups` annotation with one or more
   comma-separated consumer group names.
2. `isPluginApplicableToEntity` checks for this annotation to determine whether to render the
   plugin card.
3. `KafkaInfoComponent` fetches `aws_kafka_max_offset_lag_sum` from Prometheus via the Backstage
   proxy endpoint `/api/proxy/kafka-lag/query`.
4. The response is filtered to include only results whose `group` label matches one of the
   entity's configured consumer groups.
5. A table renders each matching topic name alongside its current lag value.

## Code Style

- **Linting:** ESLint configured via `@backstage/cli` (the root `.eslintrc.js` extends
  `@backstage/cli/config/eslint.factory`).
- **Formatting:** Prettier using `@backstage/cli/config/prettier` as the shared config.
  Line-width and style rules are inherited from Backstage defaults.
- **TypeScript:** Strict mode via `tsconfig.json`. Target and module settings are managed by
  `@backstage/cli`.
- **Imports:** Barrel exports via `index.ts` files at each public boundary. Lazy-load components
  via dynamic `import()` in plugin extensions.
- **React:** Functional components with hooks. Material UI v4 for UI primitives, Backstage
  `core-components` for plugin-standard UI elements.

## Common Mistakes

1. **Forgetting the proxy configuration.** The plugin will fail at runtime if the `/kafka-lag`
   proxy endpoint is not configured in `app-config.yaml`. Both the `target` URL and any required
   authentication headers must be set.

2. **Using the wrong Prometheus metric name.** The component queries
   `aws_kafka_max_offset_lag_sum` specifically. If the Prometheus instance uses a different metric
   name (e.g., from a different exporter), the query will return no results and the component
   will show an error state.

3. **Omitting the entity annotation.** The plugin only renders for entities that have the
   `kafka-info/consumer-groups` annotation. Without it, `isPluginApplicableToEntity` returns
   `false` and the card will not appear.

4. **Mismatched consumer group names.** The annotation value must exactly match the `group` label
   in the Prometheus metric. Typos or casing mismatches cause the filter to return an empty
   result set.

5. **Running `yarn lint` without fetching `origin/main`.** The default lint command uses
   `--since origin/main` to lint only changed files. If `origin/main` is not available (e.g.,
   shallow clone without fetch-depth 0), the command fails. Use `yarn lint:all` to lint
   everything regardless.

[readme]: ./README.md
