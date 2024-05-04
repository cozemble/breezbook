import { env } from '$env/dynamic/public';

/** The configuration object for the app */
export default {
	/** Whether or not the app is in development mode */
	devMode: env?.PUBLIC_DEV_MODE === 'true' || false,
	/** The public API URL of the server */
	apiUrl: env.PUBLIC_API_URL
};
