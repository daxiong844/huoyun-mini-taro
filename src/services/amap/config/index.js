/**
 * 高德地图API配置文件
 * 包含API密钥、基础URL和各种服务配置
 */

// 高德地图API基础配置
export const AMAP_CONFIG = {
  // API密钥 - 需要在高德开放平台申请
  // 注意：实际项目中应该将密钥放在环境变量中，不要直接写在代码里
  API_KEY: "2a0283e9199c5ae95e8b271be01eca04",

  // API基础URL
  BASE_URL: "https://restapi.amap.com",

  // API版本
  VERSION: {
    DIRECTION: "v5", // 路径规划API版本
    GEOCODE: "v3", // 地理编码API版本
    REGEO: "v3", // 逆地理编码API版本
  },

  // 请求超时时间（毫秒）
  TIMEOUT: 10000,

  // 重试配置
  RETRY: {
    MAX_ATTEMPTS: 3, // 最大重试次数
    DELAY: 1000, // 重试延迟（毫秒）
  },
};

// 路径规划服务配置
export const DIRECTION_CONFIG = {
  // 路径规划类型
  TYPES: {
    DRIVING: "driving", // 驾车
    WALKING: "walking", // 步行
    BICYCLING: "bicycling", // 骑行
    ELECTROBIKE: "electrobike", // 电动车
  },

  // 驾车路径规划策略
  DRIVING_STRATEGY: {
    FASTEST: 0, // 速度优先（时间）
    FEE_LEAST: 1, // 费用优先（不走收费路段的最快道路）
    DISTANCE: 2, // 距离优先
    NO_HIGHWAY: 3, // 不走高速
    AVOID_CONGESTION: 4, // 躲避拥堵
    MULTI_STRATEGY: 5, // 多策略（同时使用速度优先、费用优先、距离优先三个策略）
    HIGHWAY_FIRST: 6, // 高速优先
    NO_HIGHWAY_AVOID_CONGESTION: 7, // 不走高速且躲避拥堵
    FEE_LEAST_AVOID_CONGESTION: 8, // 费用优先且躲避拥堵
    DISTANCE_AVOID_CONGESTION: 9, // 距离优先且躲避拥堵
  },

  // 默认策略
  DEFAULT_STRATEGY: 10,

  // 返回数据格式
  OUTPUT_FORMAT: {
    JSON: "json",
    XML: "xml",
  },

  // 默认返回格式
  DEFAULT_OUTPUT: "json",
};

// 地理编码服务配置
export const GEOCODE_CONFIG = {
  // 批量查询最大数量
  MAX_BATCH_SIZE: 10,

  // 默认城市（当地址不明确时使用）
  DEFAULT_CITY: "全国",

  // 返回数据格式
  OUTPUT_FORMAT: {
    JSON: "json",
    XML: "xml",
  },

  // 默认返回格式
  DEFAULT_OUTPUT: "json",
};

// 逆地理编码服务配置
export const REGEO_CONFIG = {
  // 搜索半径（米）
  DEFAULT_RADIUS: 1000,

  // 返回附近POI类型
  POI_TYPE: {
    ALL: "", // 返回所有类型
    GAS_STATION: "010000", // 汽车服务|加油站
    RESTAURANT: "050000", // 餐饮服务
    HOTEL: "100000", // 住宿服务
    SHOPPING: "060000", // 购物服务
    TRANSPORT: "150000", // 交通设施服务
  },

  // 返回结果详细程度
  EXTENSIONS: {
    BASE: "base", // 返回基本地址信息
    ALL: "all", // 返回地址信息及附近POI、道路、道路交叉口等信息
  },

  // 默认扩展信息
  DEFAULT_EXTENSIONS: "base",

  // 返回数据格式
  OUTPUT_FORMAT: {
    JSON: "json",
    XML: "xml",
  },

  // 默认返回格式
  DEFAULT_OUTPUT: "json",
};

// API错误码映射
export const ERROR_CODES = {
  10000: "请求正常",
  10001: "key不正确或过期",
  10002: "没有权限使用相应的服务或者请求接口的路径拼写错误",
  10003: "访问已超出日访问量",
  10004: "单位时间内访问过于频繁",
  10005: "IP白名单出错，发送请求的服务器IP不在IP白名单内",
  10006: "绑定域名出错，发送请求的域名不在安全域名内",
  10007: "数字签名未通过验证",
  10008: "MD5安全码未通过验证",
  10009: "请求key与绑定平台不符",
  10010: "IP访问超限",
  10011: "服务不支持https请求",
  10012: "权限不足，服务请求被拒绝",
  10013: "Key被删除",
  20000: "请求参数非法",
  20001: "缺少必填参数",
  20002: "请求协议非法",
  20003: "其他未知错误",
  20800: "规划点（包括起点、终点、途经点）不在中国陆地范围内",
  20801: "划点（包括起点、终点、途经点）附近搜不到路",
  20802: "路线计算失败，通常是由于道路连通关系导致",
  20803: "起点终点距离过长",
  30000: "引擎返回数据异常",
  30001: "服务响应失败",
  30002: "请求服务响应超时",
  30003: "读取服务结果超时",
};

// 获取错误信息
export const getErrorMessage = (code) => {
  return ERROR_CODES[code] || `未知错误码: ${code}`;
};
