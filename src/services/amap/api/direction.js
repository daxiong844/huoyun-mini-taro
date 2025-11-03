/**
 * 高德地图路径规划API服务
 * 提供驾车、步行、骑行、电动车等多种出行方式的路径规划功能
 */

import { get } from "../utils/request";
import { AMAP_CONFIG, DIRECTION_CONFIG } from "../config";
import {
  isValidCoordinate,
  formatCoordinate,
  formatDistance,
  formatDuration,
  formatCost,
} from "../utils";

/**
 * 驾车路径规划
 * @param {Object} params - 路径规划参数
 * @param {string|Array|Object} params.origin - 起点坐标
 * @param {string|Array|Object} params.destination - 终点坐标
 * @param {string|Array} [params.waypoints] - 途经点坐标，最多支持16个
 * @param {number} [params.strategy=0] - 路径规划策略
 * @param {string} [params.avoidpolygons] - 避让区域
 * @param {string} [params.avoidroad] - 避让道路
 * @param {number} [params.cartype=0] - 车辆类型
 * @param {number} [params.plate] - 车牌限行
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 路径规划结果
 */
export const getDrivingRoute = async (params, options = {}) => {
  const {
    origin,
    destination,
    waypoints,
    strategy = DIRECTION_CONFIG.DEFAULT_STRATEGY,
    ...otherParams
  } = params;

  // 验证必需参数
  if (!isValidCoordinate(origin)) {
    throw new Error("起点坐标无效");
  }

  if (!isValidCoordinate(destination)) {
    throw new Error("终点坐标无效");
  }

  // 构建请求参数
  const requestParams = {
    origin: formatCoordinate(origin),
    destination: formatCoordinate(destination),
    strategy,
    output: AMAP_CONFIG.OUTPUT_FORMAT,
    ...otherParams,
  };

  // 处理途经点
  if (waypoints && waypoints.length > 0) {
    if (waypoints.length > 16) {
      throw new Error("途经点最多支持16个");
    }

    const validWaypoints = waypoints
      .filter((point) => isValidCoordinate(point))
      .map((point) => formatCoordinate(point));

    if (validWaypoints.length > 0) {
      requestParams.waypoints = validWaypoints.join(";");
    }
  }

  try {
    const response = await get(
      `/${AMAP_CONFIG.VERSION.DIRECTION}/direction/driving`,
      requestParams,
      options
    );

    // 处理响应数据
    return processDrivingResponse(response);
  } catch (error) {
    console.error("驾车路径规划失败:", error);
    throw error;
  }
};

/**
 * 步行路径规划
 * @param {Object} params - 路径规划参数
 * @param {string|Array|Object} params.origin - 起点坐标
 * @param {string|Array|Object} params.destination - 终点坐标
 * @param {number} [params.multipath=0] - 是否返回多条路径
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 路径规划结果
 */
export const getWalkingRoute = async (params, options = {}) => {
  const { origin, destination, multipath = 0, ...otherParams } = params;

  // 验证必需参数
  if (!isValidCoordinate(origin)) {
    throw new Error("起点坐标无效");
  }

  if (!isValidCoordinate(destination)) {
    throw new Error("终点坐标无效");
  }

  // 构建请求参数
  const requestParams = {
    origin: formatCoordinate(origin),
    destination: formatCoordinate(destination),
    multipath,
    output: AMAP_CONFIG.OUTPUT_FORMAT,
    ...otherParams,
  };

  try {
    const response = await get(
      `/${AMAP_CONFIG.VERSION.DIRECTION}/direction/walking`,
      requestParams,
      options
    );

    // 处理响应数据
    return processWalkingResponse(response);
  } catch (error) {
    console.error("步行路径规划失败:", error);
    throw error;
  }
};

/**
 * 骑行路径规划
 * @param {Object} params - 路径规划参数
 * @param {string|Array|Object} params.origin - 起点坐标
 * @param {string|Array|Object} params.destination - 终点坐标
 * @param {number} [params.multipath=0] - 是否返回多条路径
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 路径规划结果
 */
export const getBicyclingRoute = async (params, options = {}) => {
  const { origin, destination, multipath = 0, ...otherParams } = params;

  // 验证必需参数
  if (!isValidCoordinate(origin)) {
    throw new Error("起点坐标无效");
  }

  if (!isValidCoordinate(destination)) {
    throw new Error("终点坐标无效");
  }

  // 构建请求参数
  const requestParams = {
    origin: formatCoordinate(origin),
    destination: formatCoordinate(destination),
    multipath,
    output: AMAP_CONFIG.OUTPUT_FORMAT,
    ...otherParams,
  };

  try {
    const response = await get(
      `/${AMAP_CONFIG.VERSION.DIRECTION}/direction/bicycling`,
      requestParams,
      options
    );

    // 处理响应数据
    return processBicyclingResponse(response);
  } catch (error) {
    console.error("骑行路径规划失败:", error);
    throw error;
  }
};

/**
 * 电动车路径规划
 * @param {Object} params - 路径规划参数
 * @param {string|Array|Object} params.origin - 起点坐标
 * @param {string|Array|Object} params.destination - 终点坐标
 * @param {number} [params.multipath=0] - 是否返回多条路径
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 路径规划结果
 */
export const getElectricBikeRoute = async (params, options = {}) => {
  const { origin, destination, multipath = 0, ...otherParams } = params;

  // 验证必需参数
  if (!isValidCoordinate(origin)) {
    throw new Error("起点坐标无效");
  }

  if (!isValidCoordinate(destination)) {
    throw new Error("终点坐标无效");
  }

  // 构建请求参数
  const requestParams = {
    origin: formatCoordinate(origin),
    destination: formatCoordinate(destination),
    multipath,
    output: AMAP_CONFIG.OUTPUT_FORMAT,
    ...otherParams,
  };

  try {
    const response = await get(
      `/${AMAP_CONFIG.VERSION.DIRECTION}/direction/electrobike`,
      requestParams,
      options
    );

    // 处理响应数据
    return processElectricBikeResponse(response);
  } catch (error) {
    console.error("电动车路径规划失败:", error);
    throw error;
  }
};

/**
 * 处理驾车路径规划响应数据
 * @param {Object} response - API响应数据
 * @returns {Object} 处理后的路径数据
 */
const processDrivingResponse = (response) => {
  if (
    !response.route ||
    !response.route.paths ||
    response.route.paths.length === 0
  ) {
    throw new Error("未找到可用路径");
  }

  const route = response.route;
  const paths = route.paths.map((path) => ({
    distance: parseInt(path.distance) || 0,
    duration: parseInt(path.duration) || 0,
    tolls: parseInt(path.tolls) || 0,
    tollDistance: parseInt(path.toll_distance) || 0,
    strategy: path.strategy || "",
    distanceText: formatDistance(parseInt(path.distance) || 0),
    durationText: formatDuration(parseInt(path.duration) || 0),
    tollsText: formatCost(parseInt(path.tolls) || 0),
    steps: path.steps
      ? path.steps.map((step) => ({
          instruction: step.instruction || "",
          distance: parseInt(step.distance) || 0,
          duration: parseInt(step.duration) || 0,
          polyline: step.polyline || "",
          action: step.action || "",
          road: step.road || "",
          orientation: step.orientation || "",
          distanceText: formatDistance(parseInt(step.distance) || 0),
          durationText: formatDuration(parseInt(step.duration) || 0),
        }))
      : [],
  }));

  return {
    status: "success",
    origin: route.origin || "",
    destination: route.destination || "",
    paths,
    count: paths.length,
    taxi_cost: route.taxi_cost
      ? formatCost(parseFloat(route.taxi_cost))
      : "0元",
  };
};

/**
 * 处理步行路径规划响应数据
 * @param {Object} response - API响应数据
 * @returns {Object} 处理后的路径数据
 */
const processWalkingResponse = (response) => {
  if (
    !response.route ||
    !response.route.paths ||
    response.route.paths.length === 0
  ) {
    throw new Error("未找到可用路径");
  }

  const route = response.route;
  const paths = route.paths.map((path) => ({
    distance: parseInt(path.distance) || 0,
    duration: parseInt(path.duration) || 0,
    distanceText: formatDistance(parseInt(path.distance) || 0),
    durationText: formatDuration(parseInt(path.duration) || 0),
    steps: path.steps
      ? path.steps.map((step) => ({
          instruction: step.instruction || "",
          distance: parseInt(step.distance) || 0,
          duration: parseInt(step.duration) || 0,
          polyline: step.polyline || "",
          action: step.action || "",
          road: step.road || "",
          orientation: step.orientation || "",
          distanceText: formatDistance(parseInt(step.distance) || 0),
          durationText: formatDuration(parseInt(step.duration) || 0),
        }))
      : [],
  }));

  return {
    status: "success",
    origin: route.origin || "",
    destination: route.destination || "",
    paths,
    count: paths.length,
  };
};

/**
 * 处理骑行路径规划响应数据
 * @param {Object} response - API响应数据
 * @returns {Object} 处理后的路径数据
 */
const processBicyclingResponse = (response) => {
  if (
    !response.route ||
    !response.route.paths ||
    response.route.paths.length === 0
  ) {
    throw new Error("未找到可用路径");
  }

  const route = response.route;
  const paths = route.paths.map((path) => ({
    distance: parseInt(path.distance) || 0,
    duration: parseInt(path.duration) || 0,
    distanceText: formatDistance(parseInt(path.distance) || 0),
    durationText: formatDuration(parseInt(path.duration) || 0),
    steps: path.steps
      ? path.steps.map((step) => ({
          instruction: step.instruction || "",
          distance: parseInt(step.distance) || 0,
          duration: parseInt(step.duration) || 0,
          polyline: step.polyline || "",
          action: step.action || "",
          road: step.road || "",
          orientation: step.orientation || "",
          distanceText: formatDistance(parseInt(step.distance) || 0),
          durationText: formatDuration(parseInt(step.duration) || 0),
        }))
      : [],
  }));

  return {
    status: "success",
    origin: route.origin || "",
    destination: route.destination || "",
    paths,
    count: paths.length,
  };
};

/**
 * 处理电动车路径规划响应数据
 * @param {Object} response - API响应数据
 * @returns {Object} 处理后的路径数据
 */
const processElectricBikeResponse = (response) => {
  if (
    !response.route ||
    !response.route.paths ||
    response.route.paths.length === 0
  ) {
    throw new Error("未找到可用路径");
  }

  const route = response.route;
  const paths = route.paths.map((path) => ({
    distance: parseInt(path.distance) || 0,
    duration: parseInt(path.duration) || 0,
    distanceText: formatDistance(parseInt(path.distance) || 0),
    durationText: formatDuration(parseInt(path.duration) || 0),
    steps: path.steps
      ? path.steps.map((step) => ({
          instruction: step.instruction || "",
          distance: parseInt(step.distance) || 0,
          duration: parseInt(step.duration) || 0,
          polyline: step.polyline || "",
          action: step.action || "",
          road: step.road || "",
          orientation: step.orientation || "",
          distanceText: formatDistance(parseInt(step.distance) || 0),
          durationText: formatDuration(parseInt(step.duration) || 0),
        }))
      : [],
  }));

  return {
    status: "success",
    origin: route.origin || "",
    destination: route.destination || "",
    paths,
    count: paths.length,
  };
};

/**
 * 获取多种出行方式的路径规划
 * @param {Object} params - 路径规划参数
 * @param {string|Array|Object} params.origin - 起点坐标
 * @param {string|Array|Object} params.destination - 终点坐标
 * @param {Array} [params.modes=['driving', 'walking']] - 出行方式数组
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 多种出行方式的路径规划结果
 */
export const getMultiModeRoutes = async (params, options = {}) => {
  const {
    origin,
    destination,
    modes = ["driving", "walking"],
    ...otherParams
  } = params;

  // 验证必需参数
  if (!isValidCoordinate(origin)) {
    throw new Error("起点坐标无效");
  }

  if (!isValidCoordinate(destination)) {
    throw new Error("终点坐标无效");
  }

  const results = {};
  const errors = {};

  // 并发请求多种出行方式
  const promises = modes.map(async (mode) => {
    try {
      let result;
      const routeParams = { origin, destination, ...otherParams };

      switch (mode) {
        case "driving":
          result = await getDrivingRoute(routeParams, options);
          break;
        case "walking":
          result = await getWalkingRoute(routeParams, options);
          break;
        case "bicycling":
          result = await getBicyclingRoute(routeParams, options);
          break;
        case "electrobike":
          result = await getElectricBikeRoute(routeParams, options);
          break;
        default:
          throw new Error(`不支持的出行方式: ${mode}`);
      }

      results[mode] = result;
    } catch (error) {
      console.warn(`${mode} 路径规划失败:`, error.message);
      errors[mode] = error.message;
    }
  });

  await Promise.allSettled(promises);

  return {
    status: "success",
    origin: formatCoordinate(origin),
    destination: formatCoordinate(destination),
    results,
    errors,
    count: Object.keys(results).length,
  };
};
