// Lets scripts/test-protocol.mjs load the Worker's TypeScript sources directly.
//
// wrangler bundles the Worker, so its relative imports are extensionless
// (`from './tools'`). Node's resolver wants the extension; this appends `.ts`.
// The hook is process-global and serves require() too, so it skips
// node_modules: a dependency's own `require('./lib/helper')` must still find
// helper.js.
//
// Load with `--import`, never a plain import from the test — resolution happens
// during linking, so a hook registered from a module body is too late for its
// own imports. Needs Node >= 22.15 for registerHooks; below that the named
// import fails at link time, which is why there is no version check. The test
// script's --experimental-strip-types is for 22.15-22.17; stripping is on by
// default from 22.18, where the flag is a no-op.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, next) {
    const local = specifier.startsWith('.') && !context.parentURL?.includes('/node_modules/');
    const extensionless = local && !/\.[cm]?[jt]s(on)?$/.test(specifier);
    return next(extensionless ? `${specifier}.ts` : specifier, context);
  },
});
