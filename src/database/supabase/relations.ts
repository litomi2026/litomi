import 'server-only'

// NOTE:
// - Define Drizzle `relations()` here to avoid cyclic imports between table modules.
// - Table modules should be one-directional:
//   - Child table module imports parent table module for FK `.references(...)`.
//   - Avoid "parent imports child" in table files.
