/**
 * 高德地图API通用请求工具
 * 提供统一的HTTP请求接口，包含错误处理和重试机制
 * 兼容微信小程序和浏览器环境
 */

import { AMAP_CONFIG, getErrorMessage } from "../config";
import {
  isWechatMiniProgram,
  compatLog,
  handleCompatError,
} from "./compatibility";

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise} Promise对象
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 构建请求URL（兼容微信小程序）
 * @param {string} endpoint - API端点
 * @param {Object} params - 请求参数
 * @returns {string} 完整的请求URL
 */
const buildUrl = (endpoint, params = {}) => {
  // 添加API密钥到参数中
  const allParams = {
    ...params,
    key: AMAP_CONFIG.API_KEY,
  };

  // 构建查询字符串
  const queryString = Object.keys(allParams)
    .filter((key) => allParams[key] !== undefined && allParams[key] !== null)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`
    )
    .join("&");

  // 构建完整URL
  const baseUrl = AMAP_CONFIG.BASE_URL.endsWith("/")
    ? AMAP_CONFIG.BASE_URL.slice(0, -1)
    : AMAP_CONFIG.BASE_URL;

  const fullEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return queryString
    ? `${baseUrl}${fullEndpoint}?${queryString}`
    : `${baseUrl}${fullEndpoint}`;
};

/**
 * 发送HTTP请求（兼容微信小程序）
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} 响应数据
 */
const fetchWithTimeout = async (url, options = {}) => {
  // 微信小程序环境检测
  if (isWechatMiniProgram()) {
    compatLog(`使用微信小程序wx.request发送请求: ${url}`, "log");

    // 使用微信小程序的wx.request
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("请求超时"));
      }, AMAP_CONFIG.TIMEOUT);

      wx.request({
        url,
        method: options.method || "GET",
        data: options.body ? JSON.parse(options.body) : undefined,
        header: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        success: (res) => {
          clearTimeout(timer);
          compatLog(`请求成功: ${res.statusCode}`, "log");
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            const error = new Error(`HTTP错误: ${res.statusCode}`);
            handleCompatError(error, "wx.request");
            reject(error);
          }
        },
        fail: (error) => {
          clearTimeout(timer);
          const requestError = new Error(error.errMsg || "网络请求失败");
          handleCompatError(requestError, "wx.request");
          reject(requestError);
        },
      });
    });
  }

  // 浏览器环境使用fetch API
  compatLog(`使用fetch API发送请求: ${url}`, "log");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AMAP_CONFIG.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    compatLog(`请求成功: ${response.status}`, "log");
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      const timeoutError = new Error("请求超时");
      handleCompatError(timeoutError, "fetch");
      throw timeoutError;
    }

    handleCompatError(error, "fetch");
    throw error;
  }
};

/**
 * 带重试机制的请求函数
 * @param {string} endpoint - API端点
 * @param {Object} params - 请求参数
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} API响应数据
 */
export const amapRequest = async (endpoint, params = {}, options = {}) => {
  const {
    maxAttempts = AMAP_CONFIG.RETRY.MAX_ATTEMPTS,
    retryDelay = AMAP_CONFIG.RETRY.DELAY,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const url = buildUrl(endpoint, params);
      console.log(`高德API请求 (尝试 ${attempt}/${maxAttempts}):`, url);

      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // 检查API响应状态
      if (response.status && response.status !== "1") {
        const errorMessage = getErrorMessage(
          response.infocode || response.status
        );
        throw new Error(
          `高德API错误 (${
            response.infocode || response.status
          }): ${errorMessage}`
        );
      }

      console.log("高德API请求成功:", response);
      return response;
    } catch (error) {
      lastError = error;
      console.warn(
        `高德API请求失败 (尝试 ${attempt}/${maxAttempts}):`,
        error.message
      );

      // 如果不是最后一次尝试，则等待后重试
      if (attempt < maxAttempts) {
        console.log(`等待 ${retryDelay}ms 后重试...`);
        await delay(retryDelay);
      }
    }
  }

  // 所有重试都失败了
  throw new Error(
    `高德API请求失败，已重试 ${maxAttempts} 次: ${lastError.message}`
  );
};

/**
 * GET请求的便捷方法
 * @param {string} endpoint - API端点
 * @param {Object} params - 请求参数
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} API响应数据
 */
export const get = (endpoint, params, options) => {
  return amapRequest(endpoint, params, { ...options, method: "GET" });
};

/**
 * POST请求的便捷方法
 * @param {string} endpoint - API端点
 * @param {Object} data - 请求体数据
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} API响应数据
 */
export const post = async (endpoint, data = {}, options = {}) => {
  const {
    maxAttempts = AMAP_CONFIG.RETRY.MAX_ATTEMPTS,
    retryDelay = AMAP_CONFIG.RETRY.DELAY,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 添加API密钥到数据中
      const requestData = { ...data, key: AMAP_CONFIG.API_KEY };

      const url = `${AMAP_CONFIG.BASE_URL}${endpoint}`;
      console.log(`高德API POST请求 (尝试 ${attempt}/${maxAttempts}):`, url);

      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(requestData).toString(),
      });

      // 检查API响应状态
      if (response.status && response.status !== "1") {
        const errorMessage = getErrorMessage(
          response.infocode || response.status
        );
        throw new Error(
          `高德API错误 (${
            response.infocode || response.status
          }): ${errorMessage}`
        );
      }

      console.log("高德API POST请求成功:", response);
      return response;
    } catch (error) {
      lastError = error;
      console.warn(
        `高德API POST请求失败 (尝试 ${attempt}/${maxAttempts}):`,
        error.message
      );

      // 如果不是最后一次尝试，则等待后重试
      if (attempt < maxAttempts) {
        console.log(`等待 ${retryDelay}ms 后重试...`);
        await delay(retryDelay);
      }
    }
  }

  // 所有重试都失败了
  throw new Error(
    `高德API POST请求失败，已重试 ${maxAttempts} 次: ${lastError.message}`
  );
};
