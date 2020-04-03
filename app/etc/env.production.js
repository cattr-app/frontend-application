module.exports = {
    // If set, frontend will request backend at this url; location origin otherwise
    API_URL: null,
    API_VERSION: 'v1',

    // Set developer mode. package - load core from node_modules, local - load core from app/core
    // This param is optional
    DEVELOPER_MODE: 'local',

    // When compiling for production, set LOCAL_BUILD to true in order to load local core instead of node_modules
    // False by default
    // Requires production mode
    // This param is optional
    LOCAL_BUILD: true,

    // True to request screenshots from the backend by ID
    // False to request screenshots by path (default)
    GET_SCREENSHOTS_BY_ID: false,
};
