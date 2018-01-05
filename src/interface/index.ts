// wechat
export interface WechatParseOptions {
    start?: number;
    maxNum?: number;
    mode?: 'offline' | 'sougou' | 'all';
    biz?: string;
    cookie?: string;
    appmsg_token?: string;
}

export interface Page {
    can_msg_continue: boolean;
    errmsg: string;
    general_msg_list: string;
    msg_count: number;
    next_offset: number;
    ret: 0;
}

export interface PageList {
    list: PageItem[];
}

export interface PageItem {
    app_msg_ext_info: AppMsgExtInfo;
    comm_msg_info: CommMsgInfo;
}

export interface AppMsgExtInfo {
    author: string;
    content: string;
    content_url: string;
    copyright_stat: number;
    cover: string;
    del_flag: number;
    digest: string;
    fileid: number;
    is_multi?: boolean;
    multi_app_msg_item_list?: AppMsgExtInfo[];
    source_url: string;
    subtype: number;
    title: string;
}

export interface CommMsgInfo {
    content: string;
    datetime: number;
    fakeid: string;
    id: number;
    status: number;
    type: number;
}

export interface WechatArticle extends WechatArticleInfo {
    content: string;
    images: string[];
}

export interface WechatArticleInfo {
    id: string;
    title: string;
    author: string;
    publish_time: number;
    cover: string;
    description: string;
    url: string;
    ext?: number;
    __meta__: WechatArticleMeta;
}

export interface WechatArticleMeta {
    base?: PageItem;
    html?: string;
    images?: any[];
}