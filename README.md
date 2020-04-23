# Cattr Frontend Applicaton

## Build
```
# Install dependencies
npm install

# Copy frontend configuration file
cp app/etc/env.production.js app/etc/env.js

# Adjust parameters in env.js (API_URL at least)
nano app/etc/env.js

# Compile modules
npm run compile

# Run production build
npm run build
```

Note: if you want to work with the compiler or core use `npm link`

## Modules configuration

By default, will be loaded config from /app/etc/modules.*.json.

`modules.config.json` will always be read and loaded and then merged with contents of

`modules.<NODE_ENV>.json` if it exists, and then merged with contents of

`modules.local.json` if it exists
