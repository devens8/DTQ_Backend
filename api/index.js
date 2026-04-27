// Plain JS — loaded by @vercel/node without esbuild touching NestJS decorators
// The actual app is pre-built by `nest build` (tsc with emitDecoratorMetadata)
let appPromise;

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = require('../dist/serverless').createApp();
  }
  const app = await appPromise;
  app(req, res);
};
