// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Workaround for web-streams-polyfill invalid package.json
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'web-streams-polyfill/dist/ponyfill') {
        return {
            filePath: require.resolve('web-streams-polyfill/dist/ponyfill.js'),
            type: 'sourceFile',
        };
    }
    // Ensure we bubble back to default resolution
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
