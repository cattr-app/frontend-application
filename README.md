# Cattr Frontend Application

Here is an official development repository: https://git.amazingcat.net/AmazingTime/core/cattr-frontend

## About Cattr
Cattr is an open-source time tracking solution, designed to be flawlessly integrated with your infrastructure. 
Superpowered with features like built-in screenshot capture and activity detection, it's a great instrument to boost 
your team's performance straight to the top.

### Screenshots
Dashboard             |  Project report
:-------------------------:|:-------------------------:
![](https://git.amazingcat.net/AmazingTime/core/cattr-frontend/uploads/69a5912d9db48237c29cd58aa54728b1/2.png)  |  ![](https://git.amazingcat.net/AmazingTime/core/cattr-frontend/uploads/bd595fdde959e6aff922ce2253a8acc8/1.png)

### Demo
The demo app is available here: [demo.cattr.app](https://demo.cattr.app)

## Install Cattr
[Installation manual](https://docs.cattr.app/#/en/getting-started/) on the documentation website
```
# Install dependencies
npm install

# Adjust parameters in env.local.js (API_URL at least)
nano app/etc/env.local.js

# Compile modules
npm run compile

# Run production build
npm run build
```

Note: if you want to work with the compiler or core use `npm link`

### Env configuration

By default, will be loaded config from /app/etc/env.*.js.

`env.js` will always be read and loaded and then merged with contents of

`env.<NODE_ENV>.js` if it exists, and then merged with contents of

`env.local.js` if it exists

All variables will be accessible via VUE_APP_<variable_name> inside Vue components

### Modules configuration

By default, will be loaded config from /app/etc/modules.*.json.

`modules.config.json` will always be read and loaded and then merged with contents of

`modules.<NODE_ENV>.json` if it exists, and then merged with contents of

`modules.local.json` if it exists

## Links
https://github.com/cattr-app/desktop-application – Cattr Desktop Application. You can also download the built app for 
any OS from the [official site](https://cattr.app/desktop/).

https://github.com/cattr-app/frontend-application – Cattr Frontend Application.

https://github.com/cattr-app/backend-application – Cattr Backend Application.

## Documentation
You can find the Cattr documentation [on the website](https://docs.cattr.app)

Checkout the [Getting Started](https://docs.cattr.app/#/en/getting-started/) page for a quick overview.

## Questions
For questions and support please use the [official forum](https://community.cattr.app). 
