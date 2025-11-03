export default defineAppConfig({
  // 申请地理位置权限配置（用于微信弹窗展示用途说明）
  permission: {
    'scope.userLocation': {
      desc: '用于显示您当前位置、路线规划与附近网点展示'
    }
  },
  // 隐私保护清单：声明使用 getLocation 等私有信息接口
  // 参考：https://developers.weixin.qq.com/miniprogram/dev/framework/information.html
  requiredPrivateInfos: ['getLocation'],
  pages: [
    'pages/index/index',
    'pages/search-location/index',
    'pages/shipping/index',
    'pages/orders/index',
    'pages/order-detail/index',
    'pages/my/index',
    'pages/cooperation-list/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  }
})
