import { PageList } from '../interface';
import * as crawlerService from '../services/crawlerService';
import * as verifycodeService from '../services/verifycodeService';
import * as request from 'request';
import * as utils from '../utils';
import db from '../database';
import * as $ from 'cheerio';

let verifyRetryTimes = 0;

export async function fetchPageList(name: string): Promise<PageList> {
    const link = await search(name);
    const res = await crawlerService.search({
        uri: link,
        gzip: false,
        jQuery: true
    });

    const msglist = utils.match(res.body, /var msgList = ({.+}}]});?/);
    const pagelist: PageList = msglist && JSON.parse(msglist);
    if (pagelist) {
        verifyRetryTimes = 0;
        await replaceUrl(name, pagelist);
        return pagelist;
    } else if (res.body.indexOf('为了保护你的网络安全，请输入验证码') > 0) {
        if (verifyRetryTimes > 2) {
            console.log('验证码验证次数过多!');
            return null;
        }
        if (verifyRetryTimes > 0) {
            console.log(`正在重试第${verifyRetryTimes}次打码`);
        }
        verifyRetryTimes++;
        await verify(res.body);
        return fetchPageList(name);
    } else {
        console.log(res.$('body').text());
        return null;
    }
}

async function replaceUrl(name: string, pagelist: PageList) {
    for (let i = 0; i < pagelist.list.length; i++) {
        const item = pagelist.list[i];

        const dbArticle = await db.wechat.get(name).get(item.comm_msg_info.id.toString());
        if (dbArticle && dbArticle.__meta__.base.app_msg_ext_info.content_url.indexOf('sn=') > 0) {
            pagelist.list[i] = dbArticle.__meta__.base;
        } else {
            item.app_msg_ext_info.content_url = 'http://mp.weixin.qq.com' + item.app_msg_ext_info.content_url.replace(/&amp;/g, '&');
            if (item.app_msg_ext_info.is_multi) {
                item.app_msg_ext_info.multi_app_msg_item_list.forEach(item => {
                    item.content_url = 'http://mp.weixin.qq.com' + item.content_url.replace(/&amp;/g, '&');
                });
            }
        }
    }
}

async function search(name: string): Promise<string> {
    name = encodeURIComponent(name);
    const url = `http://weixin.sogou.com/weixin?type=1&s_from=input&query=${name}&ie=utf8&_sug_=n&_sug_type_=`;
    const res = await crawlerService.search(url);
    const link = res.$('#sogou_vr_11002301_box_0 .txt-box .tit a').attr('href');
    return link;
}

async function verify(html: string) {
    console.log('正在识别验证码!');
    const root = $.load(html);
    let image = 'http://mp.weixin.qq.com' + root("#verify_img").attr('src');
    image = `http://mp.weixin.qq.com/mp/verifycode?cert=${(new Date).getTime() + Math.random()}`;
    const cert = image.split('=')[1];
    const jar = request.jar();
    const res = await crawlerService.request({
        uri: image,
        encoding: 'base64',
        jar: jar
    });
    const cookie = jar.getCookieString(image);
    const verifycode = await verifycodeService.verity(res.body);
    if (!verifycode) {
        console.log('验证码识别失败');
        return;
    }

    const verifycode_url = `http://mp.weixin.qq.com/mp/verifycode?cert=${encodeURIComponent(cert)}&input=${encodeURIComponent(verifycode)}`;

    const result = await crawlerService.request({
        uri: verifycode_url,
        json: true,
        formData: {
            input: encodeURIComponent(verifycode),
            cert: encodeURIComponent(cert)
        },
        method: 'POST',
        headers: {
            "Cookie": cookie
        }
    });
    console.log(result.body);
    console.log('验证码识别成功');
}