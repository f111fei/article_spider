import * as path from 'path';
import * as _ from 'lodash';
import * as $ from 'cheerio';
import { Page, PageList, PageItem, WechatParseOptions, WechatArticle, WechatArticleInfo } from '../interface';
import { wechat } from '../constants';
import * as utils from '../utils';
import db from '../database';
import * as sougou from './sougou';
import * as crawlerService from '../services/crawlerService';

export class WechatParser {

    private options: WechatParseOptions;
    private start = 0;
    private maxNum = NaN;
    private name: string;

    constructor(name: string, options?: WechatParseOptions) {
        this.name = name;
        this.initOptions(options);
    }

    private initOptions(options?: WechatParseOptions) {
        this.options = options || {};
        if (this.options.maxNum === undefined) {
            this.options.maxNum = NaN;
        }
        if (this.options.start === undefined) {
            this.options.start = 0;
        }
        this.start = this.options.start;
        this.maxNum = this.options.maxNum;
    }

    public async parsePage(next: (aritcle: WechatArticle) => void) {
        if (this.options.mode === 'offline') {
            let list = await db.wechat.get(this.name).getAll();
            if (!isNaN(this.options.maxNum)) {
                list.length = this.options.maxNum;
            }
            if (this.options.start) {
                list = list.slice(this.options.start);
            }

            while (list.length > 0) {
                const id = list.shift();
                const article = await db.wechat.get(this.name).get(id);
                if (article.ext !== undefined) {
                    continue;
                }
                await this.parsePageItem(article.__meta__.base, next);
            }
            return;
        }
        if (this.options.mode === 'sougou') {
            const pageList = await sougou.fetchPageList(this.name);
            if (!pageList) {
                throw new Error('无法获取最新列表数据!');
            }
            for (let i = 0; i < pageList.list.length; i++) {
                await this.parsePageItem(pageList.list[i], next);
            }
            return;
        }

        if (!isNaN(this.maxNum) && this.maxNum <= 0) {
            return;
        }

        const page = await this.crawlPage(this.start);
        const pageList: PageList = JSON.parse(page.general_msg_list);
        for (let i = 0; i < pageList.list.length; i++) {
            await this.parsePageItem(pageList.list[i], next);
        }

        if ((isNaN(this.maxNum) || this.maxNum > 0) && page.can_msg_continue && page.next_offset) {
            this.start = this.start + 1;
            if (!isNaN(this.maxNum)) {
                this.maxNum = this.maxNum - page.msg_count;
            }
            this.parsePage(next);
        }
    }

    private async crawlPage(index: number) {
        const pageIndex = index;
        const qs = {
            ...wechat.querystring,
            offset: index * wechat.querystring.count
        };
        const res = await crawlerService.search({
            uri: wechat.domain + wechat.path,
            qs: qs,
            headers: {
                ...wechat.headers
            },
            gzip: false,
            jQuery: false
        });
    
        const page: Page = JSON.parse(res.body);
        if (page.errmsg && page.errmsg !== 'ok') {
            throw new Error(JSON.stringify(page));
        }
        if (!page.can_msg_continue || (page.errmsg && page.errmsg !== 'ok')) {
            return page;
        }
        if (!page.msg_count) {
            console.error(`下载第${pageIndex + 1}页文章数据失败: ${JSON.stringify(page)}`);
            return page;
        }
    
        console.info(`下载第${pageIndex + 1}页文章数据完成`);
        return page;
    }

    private async parsePageItem(item: PageItem, next: (article: WechatArticle) => void) {
        const infos = this.parseArticleInfo(item).filter(info => !!info);
    
        if (infos.length === 0) {
            console.warn(`解析文章数据失败: ${$['text']()}`);
        }
    
        while (infos.length > 0) {
            const info = infos.shift();
            const dbArticle = await db.wechat.get(this.name).get(info.id);
            if (dbArticle) {
                console.log(`正在更新文章数据:${JSON.stringify({ id: info.id, title: info.title })}`);
            } else {
                console.log(`正在解析文章数据:${JSON.stringify({ id: info.id, title: info.title })}`);
            }


            const article = await this.crawlDetail(info);
            if (article) {
                await next(article);
            }
        }
    }

    private parseArticleInfo(item: PageItem): WechatArticleInfo[] {
        if (!item.app_msg_ext_info || !item.comm_msg_info) {
            console.warn(`无法获取文章信息:${JSON.stringify(item)}`);
            return [];
        }
    
        const info: WechatArticleInfo = {
            id: item.comm_msg_info.id.toString(),
            title: item.app_msg_ext_info.title,
            author: item.app_msg_ext_info.author,
            cover: item.app_msg_ext_info.cover,
            description: item.app_msg_ext_info.digest,
            publish_time: item.comm_msg_info.datetime,
            url: item.app_msg_ext_info.content_url,
            __meta__: {
                base: item
            }
        };
        if (item.app_msg_ext_info.is_multi) {
            const extInfos = item.app_msg_ext_info.multi_app_msg_item_list.map((ext, index) => {
                return {
                    id: info.id + '_' + index,
                    title: ext.title,
                    author: ext.author,
                    cover: ext.cover,
                    description: ext.digest,
                    publish_time: item.comm_msg_info.datetime + index + 1,
                    url: ext.content_url,
                    ext: index,
                    __meta__: {
                        base: {
                            app_msg_ext_info: ext
                        }
                    }
                } as WechatArticleInfo;
            });
            return extInfos.concat(info);
        }
        return [info];
    }

    private async crawlDetail(info: WechatArticleInfo) {
        let body: string;
        const dbArticle = await db.wechat.get(this.name).get(info.id);
        if (dbArticle && dbArticle.__meta__.html) {
            body = dbArticle.__meta__.html;
            console.info(`成功获取缓存文章信息:${JSON.stringify({ id: info.id, title: info.title })}`);
        } else {
            const res = await crawlerService.search({
                uri: info.url,
                headers: wechat.headers,
                gzip: false,
                priority: 1
            });
            if (!res.body || res.statusCode !== 200) {
                console.error(`无法获取文章信息:${JSON.stringify({ id: info.id, title: info.title, statusCode: res.statusCode })}`);
                return null;
            }
            body = res.body;
            console.info(`成功获取文章信息:${JSON.stringify({ id: info.id, title: info.title })}`);
        }
        const root = $.load(body);
    
        const contentElement = root('#js_content');
        const imagesMeta = [];
        const imagesP = contentElement.find('img').toArray().map(async (img, index) => {
            const src = img.attribs['data-src'] || img.attribs['data-backsrc'] || img.attribs['src'];
            const type = img.attribs['data-type'] || 'jpg';
            if (!src || src.indexOf('file://') === 0) {
                console.warn(`缓存图片失败:${$.html(img, { decodeEntities: false })}`);
                return null;
            }
            imagesMeta.push({ ...img.attribs });
            const name = `${info.id}_${index}.${type}`;
            let file = db.wechat.get(this.name).getImagePath(info.id, name);
    
            if (!file) {
                const image = await crawlerService.search({
                    uri: src,
                    jQuery: false,
                    encoding: null,
                    priority: 0
                });
                file = await utils.cache(image.body, name);
                console.info(`成功缓存图片:${name}`);
            }
            $(img).attr('data-src', file);
            if (index === 0 && src === info.__meta__.base.app_msg_ext_info.cover && !img.prev &&
                img.parent.tagName === 'p' && (contentElement.find('p')[0] === img.parent)) {
                $(img).addClass('cover_image');
            }
            return file;
        });
    
        const images = (await Promise.all(imagesP)).filter(image => !!image);
    
        let content = $.html(contentElement.children(), { decodeEntities: false });
        content = _.trim(content);
    
        let coverType = utils.match(info.cover, /wx_fmt=([a-zA-Z]+)/) ||
            utils.match(info.cover, /http:\/\/mmbiz\.qpic\.cn\/mmbiz_([a-zA-Z]+)/) ||
            utils.match(_.trimStart(path.extname(info.cover), '.'), /([a-zA-Z]+)/);
        if (!coverType) {
            console.error(`无法解析图片类型:${info.cover}`);
            coverType = 'jpg';
        }
        const coverName = `${info.id}_cover.${coverType}`;
        let coverFile = db.wechat.get(this.name).getImagePath(info.id, coverName);
        if (coverFile) {
            info.cover = coverFile;
        } else {
            const image = await crawlerService.search({
                uri: info.cover,
                jQuery: false,
                encoding: null,
                priority: 0
            });
            info.cover = await utils.cache(image.body, coverName);
            console.info(`成功缓存封面:${coverName}`);
        }
    
        return {
            ...info,
            images: images,
            content: content,
            __meta__: {
                ...info.__meta__,
                html: body,
                images: imagesMeta
            }
        } as WechatArticle;
    }
}