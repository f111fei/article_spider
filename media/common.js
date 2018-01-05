if (!window.console) window.console = { log: function () { } };

if (typeof getComputedStyle == 'undefined') {
    if (document.body.currentStyle) {
        window.getComputedStyle = function (el) {
            return el.currentStyle;
        }
    } else {
        window.getComputedStyle = {};
    }
}

(function () {
    var time;
    function rem() {
        document.documentElement.style.fontSize = document.documentElement.clientWidth / 16 + 'px';
    };
    window.addEventListener('resize', function () {
        clearTimeout(time);
        time = setTimeout(rem, 300);
    });
    rem();
})();

(function () {
    window.__zoom = 1;

    (function () {
        var validArr = "," + ([0.875, 1, 1.125, 1.25, 1.375]).join(",") + ",";
        var match = window.location.href.match(/winzoom=(\d+(?:\.\d+)?)/);
        if (match && match[1]) {
            var winzoom = parseFloat(match[1]);
            if (validArr.indexOf("," + winzoom + ",") >= 0) {
                window.__zoom = winzoom;
            }
        }
    })();

    var isIE = false;
    if (typeof version != 'undefined' && version >= 6 && version <= 9) {
        isIE = true;
    }
    var getMaxWith = function () {
        var container = document.getElementById('img-content');
        var max_width = container.offsetWidth;
        var container_padding = 0;
        var container_style = getComputedStyle(container);
        container_padding = parseFloat(container_style.paddingLeft) + parseFloat(container_style.paddingRight);
        max_width -= container_padding;
        var ua = navigator.userAgent.toLowerCase();
        var re = new RegExp("msie ([0-9]+[\.0-9]*)");
        var version;
        if (re.exec(ua) != null) {
            version = parseInt(RegExp.$1);
        }
        var isIE = false;
        if (typeof version != 'undefined' && version >= 6 && version <= 9) {
            isIE = true;
        }
        if (!max_width) {
            max_width = window.innerWidth - 30;
        }
        return max_width;
    };
    var getParentWidth = function (dom) {
        var parent_width = 0;
        var parent = dom.parentNode;
        var outerWidth = 0;
        while (true) {
            var parent_style = getComputedStyle(parent);
            if (!parent || !parent_style) break;
            parent_width = parent.clientWidth - parseFloat(parent_style.paddingLeft) - parseFloat(parent_style.paddingRight) - outerWidth;
            if (parent_width > 0) break;
            outerWidth += parseFloat(parent_style.paddingLeft) + parseFloat(parent_style.paddingRight) + parseFloat(parent_style.marginLeft) + parseFloat(parent_style.marginRight) + parseFloat(parent_style.borderLeftWidth) + parseFloat(parent_style.borderRightWidth);
            parent = parent.parentNode;
        }
        return parent_width;
    }
    var getOuterW = function (dom) {
        var style = getComputedStyle(dom),
            w = 0;
        if (!!style) {
            w = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
        }
        return w;
    };
    var getOuterH = function (dom) {
        var style = getComputedStyle(dom),
            h = 0;
        if (!!style) {
            h = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
        }
        return h;
    };
    var insertAfter = function (dom, afterDom) {
        var _p = afterDom.parentNode;
        if (!_p) {
            return;
        }
        if (_p.lastChild === afterDom) {
            _p.appendChild(dom);
        } else {
            _p.insertBefore(dom, afterDom.nextSibling);
        }
    };
    var getQuery = function (name, url) {

        var u = arguments[1] || window.location.search,
            reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"),
            r = u.substr(u.indexOf("\?") + 1).match(reg);
        return r != null ? r[2] : "";
    };
    (function () {
        var images = document.getElementsByTagName('img');
        var length = images.length;
        var max_width = getMaxWith();
        for (var i = 0; i < length; ++i) {
            var src_ = images[i].getAttribute('data-src');
            var realSrc = images[i].getAttribute('src');
            if (!src_ || realSrc) continue;
            var width_ = 1 * images[i].getAttribute('data-w') || max_width;
            var ratio_ = 1 * images[i].getAttribute('data-ratio');
            var height = 100;
            if (ratio_ && ratio_ > 0) {
                var img_style = getComputedStyle(images[i]);
                var init_width = images[i].style.width;

                if (init_width) {
                    images[i].setAttribute('_width', init_width);
                    if (init_width != 'auto') width_ = parseFloat(img_style.width);
                }
                var parent_width = getParentWidth(images[i]) || max_width;
                var width = width_ > parent_width ? parent_width : width_;
                var img_padding_border = getOuterW(images[i]) || 0;
                var img_padding_border_top_bottom = getOuterH(images[i]) || 0;
                height = (width - img_padding_border) * ratio_ + img_padding_border_top_bottom;
                images[i].style.cssText += ";width: " + width + "px !important;";
                if (isIE) {
                    var url = images[i].getAttribute('data-src');
                    images[i].src = url;
                } else {
                    if (width > 40 && height > 40) {
                        images[i].className += ' img_loading';
                    }
                    images[i].src = src_;
                }
            } else {
                images[i].style.cssText += ";visibility: hidden !important;";
            }
            images[i].style.cssText += ";height: " + height + "px !important;";
        }
    })();
    window.__videoDefaultRatio = 16 / 9;
    window.__getVideoWh = function (dom) {
        var max_width = getMaxWith(),
            width = max_width,
            ratio_ = dom.getAttribute('data-ratio') * 1 || (4 / 3),
            arr = [4 / 3, 16 / 9],
            ret = arr[0],
            abs = Math.abs(ret - ratio_);
        for (var j = 1, jl = arr.length; j < jl; j++) {
            var _abs = Math.abs(arr[j] - ratio_);
            if (_abs < abs) {
                abs = _abs;
                ret = arr[j];
            }
        }
        ratio_ = ret;
        var parent_width = getParentWidth(dom) || max_width,
            width = width > parent_width ? parent_width : width,
            outerW = getOuterW(dom) || 0,
            outerH = getOuterH(dom) || 0,
            videoW = width - outerW,
            videoH = videoW / ratio_,
            height = videoH + outerH;
        return { w: width, h: height, vh: videoH, vw: videoW, ratio: ratio_ };
    };

    (function () {
        var iframe = document.getElementsByTagName('iframe');
        for (var i = 0, il = iframe.length; i < il; i++) {
            var a = iframe[i];
            var src_ = a.getAttribute('src') || a.getAttribute('data-src') || "";
            if (!/http(s)*\:\/\/v\.qq\.com\/iframe\/(preview|player)\.html\?/.test(src_)) {
                continue;
            }
            var vid = getQuery("vid", src_);
            if (!vid) {
                continue;
            }
            vid = vid.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
            a.removeAttribute('src');
            var obj = window.__getVideoWh(a);
            a.style.cssText += ";width: " + obj.w + "px !important;";
            a.setAttribute("width", obj.w);
            if (window.__zoom != 1) {
                a.style.display = "block";
                a.setAttribute("_ratio", obj.ratio);
                a.setAttribute("_vid", vid);
            } else {
                a.style.cssText += "height: " + obj.h + "px !important;";
                a.setAttribute("height", obj.h);
            }
            a.setAttribute("data-vh", obj.vh);
            a.setAttribute("data-vw", obj.vw);
            a.setAttribute("data-src", "https://v.qq.com/iframe/player.html?vid=" + vid + "&width=" + obj.vw + "&height=" + obj.vh + "&auto=0");
            a.setAttribute("src", "https://v.qq.com/iframe/player.html?vid=" + vid + "&width=" + obj.vw + "&height=" + obj.vh + "&auto=0");
        }
    })();

    (function () {
        var images = document.querySelectorAll('#js_content img');
        var length = images.length;
        function onImageClick(e) {
            e.preventDefault();
            if (!window.bridge) {
                return console.log('window.bridge未找到');
            }
            var pics = [];
            var cur = 0;
            for (var n = 0; n < images.length; n++) {
                pics.push({
                    url: images[n].attributes['data-src'] || '',
                    text: '' //todo
                });
                if (images[n] === e.currentTarget) {
                    cur = n;
                }
            }

            window.bridge.callHandler('app::picsPreview', {
                cur: cur,
                pics: pics
            });
        }

        for (var i = 0; i < length; ++i) {
            images[i].addEventListener('click', onImageClick);
        }
    })();

    (function () {
        if (window.__zoom != 1) {
            document.getElementById('page-content').style.zoom = window.__zoom;
            var a = document.getElementById('activity-name');
            var b = document.getElementById('meta_content');
            if (!!a) {
                a.style.zoom = 1 / window.__zoom;
            }
            if (!!b) {
                b.style.zoom = 1 / window.__zoom;
            }
            var images = document.getElementsByTagName('img');
            for (var i = 0, il = images.length; i < il; i++) {
                images[i].style.zoom = 1 / window.__zoom;
            }
            var iframe = document.getElementsByTagName('iframe');
            for (var i = 0, il = iframe.length; i < il; i++) {
                var a = iframe[i];
                a.style.zoom = 1 / window.__zoom;
                var src_ = a.getAttribute('data-src') || "";
                if (!/http(s)*\:\/\/v\.qq\.com\/iframe\/(preview|player)\.html\?/.test(src_)) {
                    continue;
                }
                var ratio = a.getAttribute("_ratio");
                var vid = a.getAttribute("_vid");
                a.removeAttribute("_ratio");
                a.removeAttribute("_vid");
                var vw = a.offsetWidth - (getOuterW(a) || 0);
                var vh = vw / ratio;
                var h = vh + (getOuterH(a) || 0)
                a.style.cssText += "height: " + h + "px !important;"
                a.setAttribute("height", h);
                a.setAttribute("data-src", "https://v.qq.com/iframe/player.html?vid=" + vid + "&width=" + vw + "&height=" + vh + "&auto=0");
                a.style.display = "none";
                var parent = a.parentNode;
                if (!parent) {
                    continue;
                }
                for (var j = 0, jl = parent.children.length; j < jl; j++) {
                    var child = parent.children[j];
                    if (child.className.indexOf("img_loading") >= 0 && child.getAttribute("data-vid") == vid) {
                        child.style.cssText += "height: " + h + "px !important;";
                        child.style.display = "";
                    }
                }
            }
        }
    })();
})();