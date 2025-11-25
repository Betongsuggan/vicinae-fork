import Module from "node:module";

const React = require("react");

const requireOverrides: Record<string, any> = {
	react: React,
	"react/jsx-runtime": require("react/jsx-runtime"),
	"@vicinae/api": require("@vicinae/api"),
	"@raycast/api": require("@vicinae/raycast-api-compat"),
};

const injectJsxGlobals = () => {
	const { jsx, jsxs, Fragment } = require("react/jsx-runtime");

	// react/jsx-runtime always expect non-null props
	const safeJsx =
		(original: typeof jsx) =>
			(type: React.ElementType, props: unknown, key: React.Key) =>
				original(type, props ?? {}, key);

	(globalThis as any)._jsx = safeJsx(jsx);
	(globalThis as any)._jsxs = safeJsx(jsxs);
	(globalThis as any)._jsxFragment = Fragment;

	// Expose React globally for extensions that reference it directly
	(globalThis as any).React = React;

	// Expose React's SharedInternals globally so bundled React can use it
	// This fixes the issue where bundled React has null ReactSharedInternals.H
	(globalThis as any).__REACT_SHARED_INTERNALS__ = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
};

export const patchRequire = () => {
	injectJsxGlobals();

	const originalRequire = Module.prototype.require;

	// @ts-ignore
	Module.prototype.require = function(id: string) {
		return requireOverrides[id] ?? originalRequire.call(this, id);
	};
};
