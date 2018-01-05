import * as Crawler from 'crawler';
import * as nodeRequest from 'request';

const crawler = new Crawler({
    maxConnections: 5,
    rateLimit: 1000
});

export async function request(options: nodeRequest.Options): Promise<nodeRequest.RequestResponse> {
    return new Promise<nodeRequest.RequestResponse>((c, e) => {
        nodeRequest(options, (err, res, body) => {
            if (err) {
                e(err);
            } else {
                c(res);
            }
        });
    });
}

export async function search(options: string | Crawler.CrawlerOptions): Promise<Crawler.CrawlerRes> {
    let _options: Crawler.CrawlerOptions;
    if (typeof options === 'string') {
        _options = { uri: options };
    } else {
        _options = options;
    }
    return new Promise<Crawler.CrawlerRes>((c, e) => {
        crawler.queue({
            ..._options,
            callback: (error, res, done) => {
                if (_options.callback) {
                    _options.callback(error, res, done);
                }
                if (error) {
                    e(error);
                } else {
                    c(res);
                }
                done();
            }
        });
    });
}