import { dev } from '$app/environment';
import config from '$lib/common/config';
import { H } from 'highlight.run';

if (!dev) {
	H.init('1epk540g', {
		environment: config.devMode ? 'development' : 'production',
		version: 'commit:abcdefg12345',
		tracingOrigins: true,
		networkRecording: {
			enabled: true,
			recordHeadersAndBody: true,
			urlBlocklist: [
				// insert full or partial urls that you don't want to record here
				// Out of the box, Highlight will not record these URLs (they can be safely removed):
				'https://www.googleapis.com/identitytoolkit',
				'https://securetoken.googleapis.com'
			]
		}
	});
}
