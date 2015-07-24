// API structure
// BAML - Bert's API Markup Language

// structure object defines query parameter structure of API:
//   - `search`: allow only one of the parameters specified by `search`,
//   - `filters`: enum values, or comma separated strings containing enum values
//   - `relation`: name of parameter specifying path queries
//   - `modifiers`: global query modifiers, boolean parameters
module.exports = {
  query: {
    search: {
      q: {
        pattern: null
      },
      uri: {
        pattern: null
      },
      id: {
        pattern: null
      },
      name: {
        pattern: null
      }
    },
    filters: {
      type: {
        type: 'enum'
      },
      dataset: {
        type: 'enum'
      },
      within: {
        type: 'geometry'
      },
      before: {
        type: 'date'
      },
      after: {
        type: 'date'
      }
    },
    relation: 'related'
  },
  modifiers: {
    highlight: {
      type: 'boolean',
      default: false
    },
    exact: {
      type: 'boolean',
      default: false
    },
    geometry: {
      type: 'boolean',
      default: true
    }
  }
};
