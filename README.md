## 微信公众号爬虫

- [x] 爬取公众号所有文章数据
- [x] 支持自动识别验证码
- [x] 离线数据库，包含文章原始信息，文章图片
- [x] 微信文章预览
- [ ] 命令行方式调用

### 效果预览

控制台输出：

![](/images/demo_1.png)

文章数据：

![](/images/demo_2.png)

HTML预览：

![](/images/demo_3.png)

### 实现原理

目前支持两种方式爬取文章。

#### 1.搜狗微信

通过[搜狗微信](http://weixin.sogou.com/)的搜索结果来抓取文章。

优点：这种方式不需要登录认证，操作简单。

缺点：只能抓取最近10条数据。

使用场景：适合配置定时抓取任务，来获取大量数据。

#### 2.Ajax请求

截获微信公众号文章列表的Ajax请求参数，模拟微信客户端读取文章列表和文章信息。

优点：能获取公众号所有文章数据。

缺点：需要登录微信，并且通过工具手动设置Cookie等参数，才能使用。

使用场景：一次性大量抓取公众号数据，抓取完后配合搜狗法更新数据。


### 如何使用

#### 必要环境

NodeJS & NPM, Chrome浏览器, 微信桌面客户端(Mac 或者 Windows都可)

#### 初始化环境和编译

    git clone git@github.com:f111fei/article_spider.git
    cd article_spider
    npm install typescript -g
    npm install
    tsc

#### 配置Config

设置项目根目录下的`config.json`文件。字段定义如下：

```
interface Config {
    // 必填，要抓取的微信公众号名称。
    name: string;
    // 可选，若快打码平台的账号密码。用于搜狗抓取模式下自动识别验证码。
    ruokuai: {
        username: string;
        password: string;
    };
    wechat: {
        // 可选，要抓取文章的起始页，默认0
        start?: number;
        // 可选，要抓取的文章数，默认不限制
        maxNum?: number;
        // 可选，抓取模式(sougou, all)。默认all
        mode?: string;
        // 抓取模式为all时有效，公众号的biz字段，获取方法参见下面
        biz?: string;
        // 抓取模式为all时有效，当前cookie字段，获取方法参见下面
        cookie?: string;
        // 抓取模式为all时有效，当前appmsg_token字段，获取方法参见下面
        appmsg_token?: string;
    };
}
```

#### 获取Ajax请求参数

如果抓取模式为`sougou`，请跳过此节。

要获取文章列表的Ajax请求数据，需要对获取文章列表数据的请求进行抓包，找到biz，cookie，appmsg_token等关键参数。下面介绍如何抓取请求参数。

以抓取`NASA爱好者`这个公众号为例。

1.打开公众号 --- 右上角 --- 点击查看历史消息

![](/images/1.png)

> 注意： 配置里面的`name`字段，应该填写这里的微信号`nasawatch`，而不是`NASA爱好者`。

2.在打开的窗口中，点击菜单栏上的用默认浏览器(Chrome)打开，使用Chrome打开文章列表页。

![](/images/2.png)

3.如果在浏览器中打开出现 `请在微信客户端打开链接。` 的提示，说明这个URL经过加密了，请按照下面操作获取正确的URL。否则跳过此步。

关闭微信客户端，找到微信桌面客户端可执行程序的位置。使用命令行启动程序：

Windows下通常是:

    "C:\Program Files (x86)\Tencent\WeChat\WeChat.exe" --remote-debugging-port=9222

Mac下通常是:

    "/Applications/WeChat.app/Contents/MacOS/WeChat" --remote-debugging-port=9222

按照步骤1打开历史消息页。

使用Chrome浏览器打开URL  `http://127.0.0.1:9222/json`。

![](/images/3.png)

复制url字段，在新标签页中打开，就可以看到正确的历史消息页了。

4.在历史消息页中，点击右键 ---- 检查，打开Chrome开发者工具 ---- 切换到Network页签 ---- 刷新浏览器。在右侧找到cookie, biz, appmsg_token等字段填入`config.json`中。

> 需要向下滚动列表页加载下一页找到 `https://mp.weixin.qq.com/mp/profile_ext?action=getmsg` 开头的请求，查看其参数。

![](/images/4.png)

这些字段可能几个小时之后就会失效，可以重新按照以上步骤重新获取。

#### 启动爬虫

    npm start

爬到的文章信息，图片，文章原始数据会存入项目根目录的db文件夹下。
