import * as fs from 'fs-extra';
import * as $ from 'cheerio';
import * as path from 'path';
import { WechatParser } from './parser';
import { WechatArticle, WechatParseOptions } from '../interface';
import * as utils from '../utils';
import db from '../database';
import { PipeContext, Step } from 'step-pipe';

function parse(name: string, options?: WechatParseOptions) {
    const parser = new WechatParser(name, options);
    return async (context: PipeContext<any, WechatArticle>) => {
        await parser.parsePage(context.next);
    };
}

function moveImage(name: string) {
    return async (context: PipeContext<WechatArticle>) => {
        const article = context.content;
        const articleDir = path.join(db.wechat.get(name).getDir(), article.id);
        const imagesP = article.images.map(async (oldPath, index) => {
            const newPath = path.join(articleDir, path.basename(oldPath));
            if (oldPath !== newPath) {
                await fs.move(oldPath, newPath);
                article.content = utils.replaceAll(article.content, oldPath, newPath);
            }
            return newPath;
        });
        const images = await Promise.all(imagesP);
        article.images = images;

        const dbCover = path.join(articleDir, path.basename(article.cover));
        if (dbCover !== article.cover) {
            await fs.move(article.cover, dbCover);
            article.cover = dbCover;
        }
        await context.next(article);
    };
}

function html(name: string) {
    return async (context: PipeContext<WechatArticle>) => {
        const article = context.content;
        const articleDir = path.join(db.wechat.get(name).getDir(), article.id);
        const mediaDir = path.join(__dirname, '../../media');
        let htmlTemplate = await fs.readFile(path.join(mediaDir, 'wx-article.html'), 'utf8');
        htmlTemplate = utils.replaceAll(htmlTemplate, '__{title}__', article.title);
        htmlTemplate = utils.replaceAll(htmlTemplate, '__{date}__', new Date(article.publish_time * 1000).toLocaleDateString());
        htmlTemplate = utils.replaceAll(htmlTemplate, '__{author}__', article.author);
        htmlTemplate = utils.replaceAll(htmlTemplate, '__{cover}__', article.cover);
        htmlTemplate = utils.replaceAll(htmlTemplate, '__{css}__', path.relative(articleDir, path.join(mediaDir, 'wx-mp.css')));
        htmlTemplate = utils.replaceAll(htmlTemplate, '__{js}__', path.relative(articleDir, path.join(mediaDir, 'common.js')));
        const root = $.load(htmlTemplate);
        const contentElement = root('#js_content');
        contentElement.text(article.content);
        const htmlContent = root.html({ decodeEntities: false });
        db.wechat.get(name).writeHtml(article.id, htmlContent);
        await context.next(article);
    };
}

function writeDB(name: string) {
    return async (context: PipeContext<WechatArticle>) => {
        const article = context.content;
        const dbArticle = await db.wechat.get(name).get(article.id);
        if (!utils.needUpdate(article, dbArticle)) {
            console.log(`跳过文章:${article.id}`);
            await context.next(article);
            return;
        }
        await db.wechat.get(name).write(article);
        if (!dbArticle) {
            console.info(`成功写入文章:${article.id}`);
        } else {
            console.info(`成功更新文章:${article.id}`);
        }
        await context.next(article);
    };
}

export function start(name: string, options?: WechatParseOptions) {
    const step = new Step();
    step.pipe(parse(name, options))
        .pipe(moveImage(name))
        .pipe(html(name))
        .pipe(writeDB(name));
    step.start();
}