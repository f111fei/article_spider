import * as path from 'path';
import * as fs from 'fs-extra';
import { WechatArticle } from '../interface';
import { dbPath } from '../constants';

const db = {};

class WechatDB {
    private name: string;
    private articles: { [id: string]: WechatArticle } = {};
    private dir: string;

    constructor(name: string) {
        this.name = name;
        this.dir = path.join(dbPath, name);
    }

    public async getAll() {
        const ids = await fs.readdir(this.dir);
        return ids.sort();
    }

    public async get(id: string): Promise<WechatArticle> {
        if (this.articles[id]) {
            return this.articles[id];
        }
        const articleDir = path.join(this.dir, id);
        const info = path.join(articleDir, 'info.json');
        if (!fs.existsSync(info)) {
            return null;
        }
        const article = await fs.readJSON(info);
        if (article && article.id === id) {
            this.articles[id] = article;
            return article;
        } else {
            return null;
        }
    }

    public async add(article: WechatArticle): Promise<boolean> {
        if (this.articles[article.id]) {
            return false;
        }
        const articleDir = path.join(this.dir, article.id);
        const info = path.join(articleDir, 'info.json');
        if (fs.existsSync(info)) {
            return false;
        }
        const result = await this.write(article);
        return result;
    }

    public async write(article: WechatArticle): Promise<boolean> {
        const articleDir = path.join(this.dir, article.id);
        const info = path.join(articleDir, 'info.json');
        await fs.mkdirp(articleDir);
        await fs.writeFile(info, JSON.stringify(article, null, 2));
        this.articles[article.id] = article;
        return true;
    }

    public async writeHtml(id: string, html: string) {
        const articleDir = path.join(this.dir, id);
        const htmlFile = path.join(articleDir, 'index.html');
        await fs.mkdirp(articleDir);
        await fs.writeFile(htmlFile, html);
        return true;
    }

    public getImagePath(id: string, name: string) {
        const articleDir = path.join(this.dir, id);
        const file = path.join(articleDir, path.basename(name));
        if (fs.existsSync(file)) {
            return file;
        } else {
            return null;
        }
    }

    public getDir() {
        return this.dir;
    }
}

export function get(name: string) {
    if (!db[name]) {
        db[name] = new WechatDB(name);
    }
    return db[name] as WechatDB;
}