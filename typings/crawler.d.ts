declare module 'crawler' {
    import * as request from 'request';
    import * as http from 'http';
    import * as https from 'https';
    import { EventEmitter } from 'events';

    namespace Crawler {
        export interface CrawlerRes extends http.IncomingMessage {
            $: CheerioAPI;
            body: any;
        }

        export interface CrawlerOptions {
            // Basic request options

            /**
             * The url you want to crawl.
             */
            uri?: string;
            baseUrl?: string;
            jar?: any; // CookieJar
            formData?: any; // Object
            form?: any; // Object or string
            auth?: request.AuthOptions;
            oauth?: request.OAuthOptions;
            aws?: request.AWSOptions;
            hawk?: request.HawkOptions;
            qs?: any;
            qsStringifyOptions?: any;
            qsParseOptions?: any;
            json?: any;
            jsonReviver?: (key: string, value: any) => any;
            jsonReplacer?: (key: string, value: any) => any;
            multipart?: request.RequestPart[] | request.Multipart;
            agent?: http.Agent | https.Agent;
            agentOptions?: any;
            agentClass?: any;
            forever?: any;
            host?: string;
            port?: number;
            method?: string;
            headers?: request.Headers;
            body?: any;
            followRedirect?: boolean | ((response: http.IncomingMessage) => boolean);
            followAllRedirects?: boolean;
            followOriginalHttpMethod?: boolean;
            maxRedirects?: number;
            removeRefererHeader?: boolean;
            encoding?: string | null;
            pool?: any;
            timeout?: number;
            localAddress?: string;
            proxy?: any;
            strictSSL?: boolean;
            time?: boolean;
            gzip?: boolean;
            preambleCRLF?: boolean;
            postambleCRLF?: boolean;
            withCredentials?: boolean;
            key?: Buffer;
            cert?: Buffer;
            passphrase?: string;
            ca?: string | Buffer | string[] | Buffer[];
            har?: request.HttpArchiveRequest;
            useQuerystring?: boolean;

            // Callbacks

            /**
             * Function that will be called after a request was completed
             */
            callback?: (error: Error, res: CrawlerRes, done: () => void) => void;

            // Schedule options

            /**
             * Size of the worker pool (Default 10).
             */
            maxConnections?: number;
            /**
             * Number of milliseconds to delay between each requests (Default 0).
             */
            rateLimit?: number;
            /**
             * Range of acceptable priorities starting from 0 (Default 10).
             */
            priorityRange?: number;
            /**
             * Priority of this request (Default 5). Low values have higher priority.
             */
            priority?: number;

            // Retry options

            /**
             * Number of retries if the request fails (Default 3),
             */
            retries?: number;
            /**
             * Number of milliseconds to wait before retrying (Default 10000),
             */
            retryTimeout?: number;

            // Server-side DOM options

            /**
             * Use cheerio with default configurations to inject document
             * if true or "cheerio". Or use customized cheerio if an object with Parser options.
             * Disable injecting jQuery selector if false. If you have memory leak issue in your project,
             * use "whacko", an alternative parser,to avoid that. (Default true)
             */
            jQuery?: boolean | string | object;

            // Charset encoding

            /**
             * If true crawler will get charset from HTTP headers or meta tag in html and convert it to UTF8 if necessary.
             * Never worry about encoding anymore! (Default true),
             */
            forceUTF8?: boolean;
            /**
             * With forceUTF8: true to set encoding manually (Default null)
             * so that crawler will not have to detect charset by itself.
             * For example, incomingEncoding : 'windows-1255'.
             */
            incomingEncoding?: string;

            // Cache

            /**
             * If true skips URIs that were already crawled, without even calling callback() (Default false).
             * This is not recommended, it's better to handle outside Crawler use seenreq
             */
            skipDuplicates?: boolean;

            // Other

            /**
             * If true, userAgent should be an array and rotate it (Default false)
             */
            rotateUA?: boolean;
            /**
             * If rotateUA is false, but userAgent is an array, crawler will use the first one.
             */
            userAgent?: string | string[];
            /**
             * If truthy sets the HTTP referer header
             */
            referer?: string;

            [parm: string]: any;
        }
    }

    class Crawler extends EventEmitter {
        constructor(options?: Crawler.CrawlerOptions);

        readonly queueSize: number;

        queue(uri: string): void;
        queue(uris: string[]): void;
        queue(options: Crawler.CrawlerOptions): void;

        on(event: 'schedule', listener: (options?: Crawler.CrawlerOptions) => void): this;
        on(event: 'limiterChange', listener: (options?: Crawler.CrawlerOptions, limiter?: string) => void): this;
        on(event: 'request', listener: (options?: Crawler.CrawlerOptions) => void): this;
        /**
         * Emitted when queue is empty.
         */
        on(event: 'drain', listener: () => void): this;
    }

    export = Crawler;
}