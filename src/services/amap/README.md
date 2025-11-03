# 高德地图 API 服务

基于高德地图 Web 服务 API 开发的通用服务模块，提供路径规划、地理编码、逆地理编码等功能，专为微信小程序优化。

## 功能特性

- 🗺️ **路径规划**: 支持驾车、步行、公交等多种出行方式的路径规划
- 📍 **地理编码**: 地址转坐标和坐标转地址的双向转换
- 🔍 **输入提示**: 智能搜索提示，支持POI、地址、公交站点等多种类型
- 🔧 **跨平台兼容**: 完美支持微信小程序和浏览器环境
- ⚡ **高性能**: 优化的请求处理和错误重试机制
- 🛡️ **类型安全**: 完整的 TypeScript 类型定义
- 📱 **移动优化**: 针对移动端场景优化的API设计

## 📁 目录结构

```
src/services/amap/
├── config/
│   └── index.js          # API配置文件
├── api/
│   ├── direction.js      # 路径规划API
│   ├── geocoding.js      # 地理编码API
│   └── index.js          # API统一导出
├── utils/
│   ├── request.js        # HTTP请求工具
│   └── index.js          # 通用工具函数
├── examples/
│   └── usage.js          # 使用示例
├── index.js              # 服务主入口
└── README.md             # 使用文档
```

## 🚀 快速开始

### 1. 配置 API 密钥

在 `src/services/amap/config/index.js` 中配置你的高德地图 API 密钥：

```javascript
export const AMAP_CONFIG = {
  API_KEY: "your_amap_api_key_here", // 替换为你的API密钥
  // ... 其他配置
};
```

### 2. 基本使用

```javascript
import { amapService, getDrivingRoute, geocode } from "@/services/amap";

// 方式1: 使用函数式API
const route = await getDrivingRoute({
  origin: "116.481028,39.989643",
  destination: "116.434446,39.90816",
});

// 方式2: 使用服务类实例
const address = await amapService.coordinateToAddress("116.481028,39.989643");
```

### 3. 使用服务类

```javascript
import { amapService } from '@/services/amap';

// 路径规划
const routeResult = await amapService.getRoute({
  origin: '116.481028,39.989643',
  destination: '116.465302,40.004717',
  strategy: 10
});

// 地理编码
const geoResult = await amapService.geocode({
  address: '北京市朝阳区阜通东大街6号'
});

// 输入提示
const tipsResult = await amapService.getInputTips({
  keywords: '万达广场',
  city: '北京'
});
```

### 4. 输入提示 (Input Tips)

输入提示API提供智能搜索建议功能，支持POI、地址、公交站点等多种类型的搜索提示。

#### 基础用法

```javascript
import { getInputTips, amapService } from '@/services/amap';

// 基础关键词搜索
const result = await getInputTips({
  keywords: '万达广场'
});

// 指定城市搜索
const cityResult = await getInputTips({
  keywords: '万达广场',
  city: '北京'
});

// 指定中心点搜索
const locationResult = await getInputTips({
  keywords: '咖啡厅',
  location: '116.481028,39.989643', // 经纬度
  city: '北京'
});

// 限制城市内搜索
const cityLimitResult = await getInputTips({
  keywords: '银行',
  city: '上海',
  citylimit: true
});
```

#### 分类搜索

```javascript
import { 
  searchPOITips, 
  searchAddressTips, 
  searchBusTips, 
  smartSearchTips 
} from '@/services/amap';

// POI搜索
const poiResult = await searchPOITips({
  keywords: '餐厅',
  city: '北京'
});

// 地址搜索
const addressResult = await searchAddressTips({
  keywords: '朝阳区',
  city: '北京'
});

// 公交站点搜索
const busResult = await searchBusTips({
  keywords: '地铁站',
  city: '北京'
});

// 智能搜索（自动分类）
const smartResult = await smartSearchTips({
  keywords: '北京大学',
  city: '北京'
});
```

#### 批量搜索

```javascript
import { batchGetInputTips } from '@/services/amap';

const batchParams = [
  { keywords: '麦当劳', city: '北京' },
  { keywords: '肯德基', city: '上海' },
  { keywords: '星巴克', city: '广州' }
];

const batchResults = await batchGetInputTips(batchParams);
```

#### 使用服务类

```javascript
// 使用默认服务实例
const result = await amapService.getInputTips({
  keywords: '医院',
  city: '北京'
});

// 使用POI搜索
const poiResult = await amapService.searchPOITips({
  keywords: '购物中心',
  city: '上海'
});
```

#### 在小程序中的使用

```javascript
// 页面中的使用示例
Page({
  data: {
    searchKeywords: '',
    inputTips: [],
    loading: false
  },
  
  // 输入框内容变化
  onSearchInput(e) {
    const keywords = e.detail.value;
    this.setData({ searchKeywords: keywords });
    
    // 防抖处理
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      if (keywords.trim()) {
        this.getInputTips(keywords);
      } else {
        this.setData({ inputTips: [] });
      }
    }, 300);
  },
  
  // 获取输入提示
  async getInputTips(keywords) {
    this.setData({ loading: true });
    
    try {
      const result = await amapService.getInputTips({
        keywords: keywords,
        city: '北京'
      });
      
      this.setData({
        inputTips: result.tips || [],
        loading: false
      });
      
    } catch (error) {
      console.error('获取输入提示失败:', error);
      this.setData({ inputTips: [], loading: false });
    }
  },
  
  // 选择提示项
  onTipSelect(e) {
    const index = e.currentTarget.dataset.index;
    const selectedTip = this.data.inputTips[index];
    
    this.setData({
      searchKeywords: selectedTip.name,
      inputTips: []
    });
    
    console.log('选择的提示:', selectedTip);
  }
});
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keywords | string | 是 | 查询关键词 |
| city | string | 否 | 搜索城市，可以是城市名或城市编码 |
| location | string | 否 | 中心点坐标，格式：经度,纬度 |
| citylimit | boolean | 否 | 是否限制在指定城市内搜索 |
| datatype | string | 否 | 返回数据类型：all(默认)、poi、bus |
| type | string | 否 | POI分类代码，限制搜索POI类型 |

#### 返回数据格式

```javascript
{
  success: true,
  count: 10,
  tips: [
    {
      id: "B000A7BD6C",
      name: "万达广场",
      district: "朝阳区",
      adcode: "110105",
      location: "116.480881,39.989410",
      address: "建国路93号",
      typecode: "060401",
      coordinates: {
        longitude: 116.480881,
        latitude: 39.989410
      },
      formattedAddress: "北京市朝阳区建国路93号万达广场"
    }
  ]
}
```

## 📖 API 文档

### 路径规划

#### 驾车路径规划

```javascript
import { getDrivingRoute } from "@/services/amap";

const result = await getDrivingRoute({
  origin: "116.481028,39.989643", // 起点坐标
  destination: "116.434446,39.90816", // 终点坐标
  waypoints: ["116.465302,39.925818"], // 途经点（可选）
  strategy: 0, // 路径策略（可选）
  avoidpolygons: "", // 避让区域（可选）
  avoidroad: "", // 避让道路（可选）
  cartype: 0, // 车辆类型（可选）
  plate: 1, // 车牌限行（可选）
});
```

**路径策略说明：**

- `0`: 速度优先（默认）
- `1`: 费用优先（不走收费路段的最快道路）
- `2`: 距离优先
- `3`: 不走快速路
- `4`: 躲避拥堵
- `5`: 多策略（同时使用速度优先、费用优先、距离优先三个策略）
- `6`: 不走高速
- `7`: 不走高速且避免收费
- `8`: 躲避收费和拥堵
- `9`: 不走高速且躲避收费和拥堵

#### 步行路径规划

```javascript
import { getWalkingRoute } from "@/services/amap";

const result = await getWalkingRoute({
  origin: "116.481028,39.989643",
  destination: "116.434446,39.90816",
  multipath: 0, // 是否返回多条路径
});
```

#### 骑行路径规划

```javascript
import { getBicyclingRoute } from "@/services/amap";

const result = await getBicyclingRoute({
  origin: "116.481028,39.989643",
  destination: "116.434446,39.90816",
});
```

#### 电动车路径规划

```javascript
import { getElectricBikeRoute } from "@/services/amap";

const result = await getElectricBikeRoute({
  origin: "116.481028,39.989643",
  destination: "116.434446,39.90816",
});
```

#### 多种出行方式对比

```javascript
import { getMultiModeRoutes } from "@/services/amap";

const result = await getMultiModeRoutes({
  origin: "116.481028,39.989643",
  destination: "116.434446,39.90816",
  modes: ["driving", "walking", "bicycling", "electrobike"],
});
```

### 地理编码

#### 地址转坐标

```javascript
import { geocode } from "@/services/amap";

const result = await geocode({
  address: "北京市朝阳区阜通东大街6号",
  city: "北京", // 可选，指定城市可提高精确度
});
```

#### 批量地址转坐标

```javascript
import { batchGeocode } from "@/services/amap";

const result = await batchGeocode({
  addresses: [
    "北京市朝阳区阜通东大街6号",
    "上海市浦东新区世纪大道1号",
    "广州市天河区珠江新城",
  ],
  city: "北京", // 可选
});
```

#### 坐标转地址

```javascript
import { reverseGeocode } from "@/services/amap";

const result = await reverseGeocode({
  location: "116.481028,39.989643",
  radius: 1000, // 搜索半径
  extensions: "all", // 返回结果详细程度
  poitype: "", // POI类型过滤
  roadlevel: "", // 道路等级
});
```

#### 批量坐标转地址

```javascript
import { batchReverseGeocode } from "@/services/amap";

const result = await batchReverseGeocode({
  locations: [
    "116.481028,39.989643",
    "121.473701,31.230416",
    "113.280637,23.125178",
  ],
  radius: 1000,
});
```

#### 地址模糊搜索

```javascript
import { searchAddress } from "@/services/amap";

const result = await searchAddress({
  keywords: "万达广场",
  city: "北京",
  location: "116.481028,39.989643", // 中心点
  radius: 5000, // 搜索半径
});
```

## 🛠 服务类使用

### 创建服务实例

```javascript
import { AmapService, createAmapService } from "@/services/amap";

// 使用默认配置
const service = new AmapService();

// 使用自定义配置
const customService = createAmapService({
  maxAttempts: 5, // 最大重试次数
  retryDelay: 2000, // 重试延迟（毫秒）
});
```

### 便捷方法

```javascript
// 获取两点间距离和时间
const distance = await service.getDistanceAndDuration(
  "116.481028,39.989643",
  "116.434446,39.90816"
);

// 地址转坐标便捷方法
const coordinate = await service.addressToCoordinate(
  "北京市朝阳区阜通东大街6号",
  "北京"
);

// 坐标转地址便捷方法
const address = await service.coordinateToAddress("116.481028,39.989643");

// 获取指定出行方式的路径
const route = await service.getRoute(
  "116.481028,39.989643",
  "116.434446,39.90816",
  "bicycling" // 出行方式
);
```

## 📱 在小程序中使用

### 页面中使用

```javascript
import { amapService } from "@/services/amap";

Page({
  data: {
    routeResult: null,
    loading: false,
  },

  async onLoad() {
    // 获取当前位置的地址
    const currentAddress = await this.getCurrentAddress();
    console.log("当前地址:", currentAddress);
  },

  // 获取路径规划
  async getRoute() {
    this.setData({ loading: true });

    try {
      const result = await amapService.getDrivingRoute({
        origin: "116.481028,39.989643",
        destination: "116.434446,39.90816",
      });

      this.setData({
        routeResult: result,
        loading: false,
      });

      wx.showToast({
        title: "路径规划成功",
        icon: "success",
      });
    } catch (error) {
      console.error("路径规划失败:", error);
      this.setData({ loading: false });

      wx.showToast({
        title: error.message || "路径规划失败",
        icon: "none",
      });
    }
  },

  // 获取当前位置的地址
  async getCurrentAddress() {
    try {
      // 获取当前位置
      const location = await new Promise((resolve, reject) => {
        wx.getLocation({
          type: "gcj02",
          success: resolve,
          fail: reject,
        });
      });

      // 逆地理编码
      const result = await amapService.coordinateToAddress(
        `${location.longitude},${location.latitude}`
      );

      return result.address;
    } catch (error) {
      console.error("获取当前地址失败:", error);
      return null;
    }
  },
});
```

### 组件中使用

```javascript
import { Component } from "@remax/wechat";
import { amapService } from "@/services/amap";

export default class RouteComponent extends Component {
  state = {
    routes: [],
    loading: false,
  };

  async componentDidMount() {
    await this.loadRoutes();
  }

  loadRoutes = async () => {
    this.setState({ loading: true });

    try {
      const result = await amapService.getMultiModeRoutes({
        origin: this.props.origin,
        destination: this.props.destination,
        modes: ["driving", "walking", "bicycling"],
      });

      this.setState({
        routes: result.results,
        loading: false,
      });
    } catch (error) {
      console.error("加载路径失败:", error);
      this.setState({ loading: false });
    }
  };

  render() {
    const { routes, loading } = this.state;

    return (
      <view className="route-component">
        {loading ? (
          <view>加载中...</view>
        ) : (
          routes.map((route, index) => (
            <view key={index} className="route-item">
              <text>{route.distanceText}</text>
              <text>{route.durationText}</text>
            </view>
          ))
        )}
      </view>
    );
  }
}
```

## 🔧 配置说明

### API 配置

```javascript
export const AMAP_CONFIG = {
  // API密钥（必须配置）
  API_KEY: "your_api_key_here",

  // 基础URL
  BASE_URL: "https://restapi.amap.com",

  // API版本
  VERSION: {
    DIRECTION: "v5", // 路径规划API版本
    GEOCODING: "v3", // 地理编码API版本
  },

  // 请求超时时间（毫秒）
  TIMEOUT: 10000,

  // 重试配置
  RETRY: {
    MAX_ATTEMPTS: 3, // 最大重试次数
    DELAY: 1000, // 重试延迟（毫秒）
  },

  // 驾车路径规划配置
  DRIVING: {
    DEFAULT_STRATEGY: 0, // 默认路径策略
  },

  // 输出格式
  OUTPUT_FORMAT: "JSON",
};
```

### 坐标格式支持

服务支持多种坐标格式：

```javascript
// 字符串格式
'116.481028,39.989643'

// 数组格式
[116.481028, 39.989643]

// 对象格式
{ lng: 116.481028, lat: 39.989643 }
{ longitude: 116.481028, latitude: 39.989643 }
```

## ⚠️ 注意事项

1. **API 密钥配置**：使用前必须在配置文件中设置有效的高德地图 API 密钥
2. **坐标系统**：高德地图使用 GCJ-02 坐标系，与 GPS 原始坐标（WGS-84）有偏差
3. **请求频率**：注意 API 调用频率限制，避免超出配额
4. **错误处理**：建议在业务代码中添加适当的错误处理逻辑
5. **网络环境**：小程序中使用需要在小程序管理后台配置服务器域名白名单

## 🔗 相关链接

- [高德地图 Web 服务 API 文档](https://lbs.amap.com/api/webservice/summary)
- [高德地图路径规划 API](https://lbs.amap.com/api/webservice/guide/api/newroute)
- [高德地图地理编码 API](https://lbs.amap.com/api/webservice/guide/api/georegeo)

## 📄 许可证

MIT License
