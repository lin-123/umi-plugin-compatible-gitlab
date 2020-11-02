// umi 插件
const INSET_REPO_URL = 'ssqwhjtyrikss.gitlab';
export default api => {
  api.logger.info('use plugin');
  const getRepoUrl = url =>
    url.replace(/(\w+)(\.com)/, `$1${INSET_REPO_URL}$2`);
  // 将 repo url 从 git.jd.com 替换成 git.jdssqwhjtyrikss.gitlab.com， 这样 dumi 才能正确识别
  api.onStart(() => {
    const { repository } = api.pkg;
    if (!repository) return;
    if (typeof repository === 'string') {
      api.pkg.repository = getRepoUrl(repository);
      return;
    }
    api.pkg.repository.url = getRepoUrl(repository.url);
  });
  // api.modifyConfig((memo) => {
  //   console.log('config', memo)
  //   return memo;
  // });
  /**
   * 解决两个问题：
   *  1. 将 git.jdssqwhjtyrikss.gitlab.com 恢复成 git.jd.com
   *  2. 此处拼装的跳转地址
   * */
  // api.modifyProdHTMLContent((content) => {
  //   const { repository } = api.pkg;
  //   const branch = repository.branch || 'master';
  //   const reg = new RegExp(`(${INSET_REPO_URL})(.com\\/[\\w|-]+\\/[\\w|-]+/edit/)(\\w+)`)
  //   return content.replace(reg, `$2${branch}/docs`)
  // });

  // 把 repo 地址纠正回来， 同时加入分支属性
  api.addHTMLScripts(() => {
    const { repository = {} } = api.pkg;
    const branch = repository.branch || 'master';
    /**
     * 函数注释
     * registerHrefEvent
     *  1. 注册 pushState replaceState 事件， 监听路由变化
     *  2. 参考文章： https://juejin.im/post/6844903749421367303
     *
     * restoreRepoUrl
     *    1. 将 git.jdssqwhjtyrikss.gitlab.com 恢复成 git.jd.com
     *    2. 此处拼装的跳转地址
     */

    return [
      {
        content: `
        console.log('replace git');
        (function() {
          function registerHrefEvent() {
            var _wr = function(type) {
              var orig = history[type];
              return function() {
                var rv = orig.apply(this, arguments);
                var e = new Event(type);
                e.arguments = arguments;
                window.dispatchEvent(e);
                return rv;
              };
            };
            history.pushState = _wr('pushState');
            history.replaceState = _wr('replaceState');
          }

          function restoreRepoUrl() {
            setTimeout(function () {
              document.querySelectorAll('a[target=_blank]')
                .forEach(function(ele) {
                  var href = ele.href;
                  if (href.indexOf('${INSET_REPO_URL}') === -1) {
                    return;
                  }
                  ele.href = ele.href.replace('${INSET_REPO_URL}', '')
                    .replace('\/edit\/master', '/edit/${branch}/docs')
                });
            }, 300);
          }

          registerHrefEvent();
          restoreRepoUrl();
          window.addEventListener('replaceState', function(e) {
            restoreRepoUrl();
            console.log('THEY DID IT AGAIN! replaceState 111111');
          });
          window.addEventListener('pushState', function(e) {
            restoreRepoUrl();
            console.log('THEY DID IT AGAIN! pushState 2222222');
          });
        })();
      `,
      },
    ];
  });
};
