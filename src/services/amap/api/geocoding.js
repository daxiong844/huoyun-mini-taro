/**
 * 高德地图地理编码API服务
 * 提供地址转坐标（地理编码）和坐标转地址（逆地理编码）功能
 */

import { get } from "../utils/request";
import { AMAP_CONFIG } from "../config";
import {
  isValidCoordinate,
  formatCoordinate,
  isValidAddress,
  cleanAddress,
  parseCoordinate,
} from "../utils";

/**
 * 地理编码 - 地址转坐标
 * @param {Object} params - 地理编码参数
 * @param {string} params.address - 地址信息
 * @param {string} [params.city] - 指定查询的城市
 * @param {string} [params.batch=false] - 是否批量查询
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 地理编码结果
 */
export const geocode = async (params, options = {}) => {
  const { address, city, batch = false, ...otherParams } = params;

  // 验证必需参数
  if (!isValidAddress(address)) {
    throw new Error("地址信息无效");
  }

  // 构建请求参数
  const requestParams = {
    address: cleanAddress(address),
    output: AMAP_CONFIG.OUTPUT_FORMAT,
    batch: batch ? "true" : "false",
    ...otherParams,
  };

  // 添加城市限制
  if (city && isValidAddress(city)) {
    requestParams.city = cleanAddress(city);
  }

  try {
    const response = await get(
      `/${AMAP_CONFIG.VERSION.GEOCODE}/geocode/geo`,
      requestParams,
      options
    );

    // 处理响应数据
    return processGeocodeResponse(response);
  } catch (error) {
    console.error("地理编码失败:", error);
    throw error;
  }
};

/**
 * 批量地理编码 - 多个地址转坐标
 * @param {Object} params - 批量地理编码参数
 * @param {Array<string>} params.addresses - 地址数组，最多支持10个
 * @param {string} [params.city] - 指定查询的城市
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 批量地理编码结果
 */
export const batchGeocode = async (params, options = {}) => {
  const { addresses, city, ...otherParams } = params;

  // 验证必需参数
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error("地址数组不能为空");
  }

  if (addresses.length > 10) {
    throw new Error("批量地理编码最多支持10个地址");
  }

  // 验证每个地址
  const validAddresses = addresses.filter((addr) => isValidAddress(addr));
  if (validAddresses.length === 0) {
    throw new Error("没有有效的地址信息");
  }

  // 构建请求参数
  const requestParams = {
    address: validAddresses.map((addr) => cleanAddress(addr)).join("|"),
    output: AMAP_CONFIG.OUTPUT_FORMAT,
    batch: "true",
    ...otherParams,
  };

  // 添加城市限制
  if (city && isValidAddress(city)) {
    requestParams.city = cleanAddress(city);
  }

  try {
    const response = await get(
      `/${AMAP_CONFIG.VERSION.GEOCODE}/geocode/geo`,
      requestParams,
      options
    );

    // 处理响应数据
    return processBatchGeocodeResponse(response, validAddresses);
  } catch (error) {
    console.error("批量地理编码失败:", error);
    throw error;
  }
};

/**
 * 逆地理编码 - 坐标转地址
 * @param {Object} params - 逆地理编码参数
 * @param {string|Array|Object} params.location - 坐标信息
 * @param {string} [params.poitype] - POI类型
 * @param {number} [params.radius=1000] - 搜索半径
 * @param {string} [params.extensions=base] - 返回结果控制
 * @param {string} [params.batch=false] - 是否批量查询
 * @param {string} [params.roadlevel] - 道路等级
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 逆地理编码结果
 */
export const reverseGeocode = async (params, options = {}) => {
  const {
    location,
    poitype,
    radius = 1000,
    extensions = "base",
    batch = false,
    roadlevel,
    ...otherParams
  } = params;

  // 验证必需参数
  if (!isValidCoordinate(location)) {
    console.log("坐标信息无效:location", location);
    throw new Error("坐标信息无效");
  }

  // 构建请求参数
  const requestParams = {
    location: formatCoordinate(location),
    radius,
    extensions,
    output: AMAP_CONFIG.OUTPUT_FORMAT,
    batch: batch ? "true" : "false",
    ...otherParams,
  };

  // 添加可选参数
  if (poitype) {
    requestParams.poitype = poitype;
  }

  if (roadlevel) {
    requestParams.roadlevel = roadlevel;
  }

  try {
    const response = await get(
      `/${AMAP_CONFIG.VERSION.REGEO}/geocode/regeo`,
      requestParams,
      options
    );

    // 处理响应数据
    return processReverseGeocodeResponse(response);
  } catch (error) {
    console.error("逆地理编码失败:", error);
    throw error;
  }
};

/**
 * 批量逆地理编码 - 多个坐标转地址
 * @param {Object} params - 批量逆地理编码参数
 * @param {Array} params.locations - 坐标数组，最多支持20个
 * @param {string} [params.poitype] - POI类型
 * @param {number} [params.radius=1000] - 搜索半径
 * @param {string} [params.extensions=base] - 返回结果控制
 * @param {string} [params.roadlevel] - 道路等级
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 批量逆地理编码结果
 */
export const batchReverseGeocode = async (params, options = {}) => {
  const {
    locations,
    poitype,
    radius = 1000,
    extensions = "base",
    roadlevel,
    ...otherParams
  } = params;

  // 验证必需参数
  if (!Array.isArray(locations) || locations.length === 0) {
    throw new Error("坐标数组不能为空");
  }

  if (locations.length > 20) {
    throw new Error("批量逆地理编码最多支持20个坐标");
  }

  // 验证每个坐标
  const validLocations = locations.filter((loc) => isValidCoordinate(loc));
  if (validLocations.length === 0) {
    throw new Error("没有有效的坐标信息");
  }

  // 构建请求参数
  const requestParams = {
    location: validLocations.map((loc) => formatCoordinate(loc)).join("|"),
    radius,
    extensions,
    output: AMAP_CONFIG.OUTPUT_FORMAT,
    batch: "true",
    ...otherParams,
  };

  // 添加可选参数
  if (poitype) {
    requestParams.poitype = poitype;
  }

  if (roadlevel) {
    requestParams.roadlevel = roadlevel;
  }

  try {
    const response = await get(
      `/${AMAP_CONFIG.VERSION.REGEO}/geocode/regeo`,
      requestParams,
      options
    );

    // 处理响应数据
    return processBatchReverseGeocodeResponse(response, validLocations);
  } catch (error) {
    console.error("批量逆地理编码失败:", error);
    throw error;
  }
};

/**
 * 处理地理编码响应数据
 * @param {Object} response - API响应数据
 * @returns {Object} 处理后的地理编码数据
 */
const processGeocodeResponse = (response) => {
  if (!response.geocodes || response.geocodes.length === 0) {
    throw new Error("未找到匹配的地址信息");
  }

  const geocode = response.geocodes[0];
  const coordinate = parseCoordinate(geocode.location);

  return {
    status: "success",
    address: geocode.formatted_address || "",
    location: geocode.location || "",
    coordinate,
    level: geocode.level || "",
    confidence: geocode.confidence || "",
    province: geocode.province || "",
    city: geocode.city || "",
    district: geocode.district || "",
    township: geocode.township || "",
    neighborhood: geocode.neighborhood || "",
    building: geocode.building || "",
    adcode: geocode.adcode || "",
    street: geocode.street || "",
    number: geocode.number || "",
    country: geocode.country || "中国",
  };
};

/**
 * 处理批量地理编码响应数据
 * @param {Object} response - API响应数据
 * @param {Array} addresses - 原始地址数组
 * @returns {Object} 处理后的批量地理编码数据
 */
const processBatchGeocodeResponse = (response, addresses) => {
  if (!response.geocodes || response.geocodes.length === 0) {
    throw new Error("批量地理编码未返回任何结果");
  }

  const results = response.geocodes.map((geocode, index) => {
    const coordinate = parseCoordinate(geocode.location);

    return {
      originalAddress: addresses[index] || "",
      address: geocode.formatted_address || "",
      location: geocode.location || "",
      coordinate,
      level: geocode.level || "",
      confidence: geocode.confidence || "",
      province: geocode.province || "",
      city: geocode.city || "",
      district: geocode.district || "",
      township: geocode.township || "",
      neighborhood: geocode.neighborhood || "",
      building: geocode.building || "",
      adcode: geocode.adcode || "",
      street: geocode.street || "",
      number: geocode.number || "",
      country: geocode.country || "中国",
    };
  });

  return {
    status: "success",
    count: results.length,
    results,
  };
};

/**
 * 处理逆地理编码响应数据
 * @param {Object} response - API响应数据
 * @returns {Object} 处理后的逆地理编码数据
 */
const processReverseGeocodeResponse = (response) => {
  if (!response.regeocode) {
    throw new Error("逆地理编码未返回结果");
  }

  const regeocode = response.regeocode;
  const addressComponent = regeocode.addressComponent || {};

  return {
    status: "success",
    address: regeocode.formatted_address || "",
    addressComponent: {
      country: addressComponent.country || "中国",
      province: addressComponent.province || "",
      city: addressComponent.city || "",
      citycode: addressComponent.citycode || "",
      district: addressComponent.district || "",
      adcode: addressComponent.adcode || "",
      township: addressComponent.township || "",
      towncode: addressComponent.towncode || "",
      neighborhood: addressComponent.neighborhood || "",
      building: addressComponent.building || "",
      streetNumber: {
        street: addressComponent.streetNumber?.street || "",
        number: addressComponent.streetNumber?.number || "",
        location: addressComponent.streetNumber?.location || "",
        direction: addressComponent.streetNumber?.direction || "",
        distance: addressComponent.streetNumber?.distance || "",
      },
      businessAreas: addressComponent.businessAreas || [],
    },
    pois: regeocode.pois
      ? regeocode.pois.map((poi) => ({
          id: poi.id || "",
          name: poi.name || "",
          type: poi.type || "",
          tel: poi.tel || "",
          direction: poi.direction || "",
          distance: poi.distance || "",
          location: poi.location || "",
          address: poi.address || "",
          poiweight: poi.poiweight || "",
          businessarea: poi.businessarea || "",
        }))
      : [],
    roads: regeocode.roads
      ? regeocode.roads.map((road) => ({
          id: road.id || "",
          name: road.name || "",
          direction: road.direction || "",
          distance: road.distance || "",
          location: road.location || "",
        }))
      : [],
    roadinters: regeocode.roadinters
      ? regeocode.roadinters.map((roadinter) => ({
          direction: roadinter.direction || "",
          distance: roadinter.distance || "",
          location: roadinter.location || "",
          first_id: roadinter.first_id || "",
          first_name: roadinter.first_name || "",
          second_id: roadinter.second_id || "",
          second_name: roadinter.second_name || "",
        }))
      : [],
    aois: regeocode.aois
      ? regeocode.aois.map((aoi) => ({
          id: aoi.id || "",
          name: aoi.name || "",
          adcode: aoi.adcode || "",
          location: aoi.location || "",
          area: aoi.area || "",
          distance: aoi.distance || "",
          type: aoi.type || "",
        }))
      : [],
  };
};

/**
 * 处理批量逆地理编码响应数据
 * @param {Object} response - API响应数据
 * @param {Array} locations - 原始坐标数组
 * @returns {Object} 处理后的批量逆地理编码数据
 */
const processBatchReverseGeocodeResponse = (response, locations) => {
  if (!response.regeocodes || response.regeocodes.length === 0) {
    throw new Error("批量逆地理编码未返回任何结果");
  }

  const results = response.regeocodes.map((regeocode, index) => {
    const addressComponent = regeocode.addressComponent || {};

    return {
      originalLocation: formatCoordinate(locations[index]) || "",
      address: regeocode.formatted_address || "",
      addressComponent: {
        country: addressComponent.country || "中国",
        province: addressComponent.province || "",
        city: addressComponent.city || "",
        citycode: addressComponent.citycode || "",
        district: addressComponent.district || "",
        adcode: addressComponent.adcode || "",
        township: addressComponent.township || "",
        towncode: addressComponent.towncode || "",
        neighborhood: addressComponent.neighborhood || "",
        building: addressComponent.building || "",
        streetNumber: {
          street: addressComponent.streetNumber?.street || "",
          number: addressComponent.streetNumber?.number || "",
          location: addressComponent.streetNumber?.location || "",
          direction: addressComponent.streetNumber?.direction || "",
          distance: addressComponent.streetNumber?.distance || "",
        },
        businessAreas: addressComponent.businessAreas || [],
      },
    };
  });

  return {
    status: "success",
    count: results.length,
    results,
  };
};

/**
 * 地址模糊搜索
 * @param {Object} params - 搜索参数
 * @param {string} params.keywords - 搜索关键词
 * @param {string} [params.city] - 指定搜索的城市
 * @param {string|Array|Object} [params.location] - 中心点坐标
 * @param {number} [params.radius=3000] - 搜索半径
 * @param {Object} [options] - 请求选项
 * @returns {Promise<Object>} 地址搜索结果
 */
export const searchAddress = async (params, options = {}) => {
  const { keywords, city, location, radius = 3000, ...otherParams } = params;

  // 验证必需参数
  if (!isValidAddress(keywords)) {
    throw new Error("搜索关键词无效");
  }

  // 构建请求参数
  const requestParams = {
    address: cleanAddress(keywords),
    output: AMAP_CONFIG.OUTPUT_FORMAT,
    ...otherParams,
  };

  // 添加城市限制
  if (city && isValidAddress(city)) {
    requestParams.city = cleanAddress(city);
  }

  // 添加位置和半径
  if (location && isValidCoordinate(location)) {
    requestParams.location = formatCoordinate(location);
    requestParams.radius = radius;
  }

  try {
    const response = await get(
      `/${AMAP_CONFIG.VERSION.GEOCODE}/geocode/geo`,
      requestParams,
      options
    );

    // 处理响应数据
    return processSearchAddressResponse(response);
  } catch (error) {
    console.error("地址搜索失败:", error);
    throw error;
  }
};

/**
 * 处理地址搜索响应数据
 * @param {Object} response - API响应数据
 * @returns {Object} 处理后的地址搜索数据
 */
const processSearchAddressResponse = (response) => {
  if (!response.geocodes || response.geocodes.length === 0) {
    return {
      status: "success",
      count: 0,
      results: [],
    };
  }

  const results = response.geocodes.map((geocode) => {
    const coordinate = parseCoordinate(geocode.location);

    return {
      address: geocode.formatted_address || "",
      location: geocode.location || "",
      coordinate,
      level: geocode.level || "",
      confidence: geocode.confidence || "",
      province: geocode.province || "",
      city: geocode.city || "",
      district: geocode.district || "",
      township: geocode.township || "",
      neighborhood: geocode.neighborhood || "",
      building: geocode.building || "",
      adcode: geocode.adcode || "",
      street: geocode.street || "",
      number: geocode.number || "",
      country: geocode.country || "中国",
    };
  });

  return {
    status: "success",
    count: results.length,
    results,
  };
};
