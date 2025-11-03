/**
 * 微信小程序兼容性工具
 * 提供环境检测和API兼容性处理
 */

/**
 * 检测是否为微信小程序环境
 * @returns {boolean} 是否为微信小程序环境
 */
export const isWechatMiniProgram = () => {
  return typeof wx !== "undefined" && wx.request && wx.getSystemInfo;
};

/**
 * 检测是否为浏览器环境
 * @returns {boolean} 是否为浏览器环境
 */
export const isBrowser = () => {
  return typeof window !== "undefined" && typeof fetch !== "undefined";
};

/**
 * 获取当前运行环境
 * @returns {string} 环境类型：'wechat' | 'browser' | 'unknown'
 */
export const getEnvironment = () => {
  if (isWechatMiniProgram()) {
    return "wechat";
  }
  if (isBrowser()) {
    return "browser";
  }
  return "unknown";
};

/**
 * 兼容性日志输出
 * @param {string} message - 日志消息
 * @param {string} level - 日志级别：'log' | 'warn' | 'error'
 */
export const compatLog = (message, level = "log") => {
  const env = getEnvironment();
  const prefix = `[${env.toUpperCase()}]`;

  // 验证日志级别是否有效
  const validLevels = ["log", "warn", "error", "info", "debug"];
  const safeLevel = validLevels.includes(level) ? level : "log";

  try {
    if (isWechatMiniProgram()) {
      // 微信小程序使用console，确保方法存在
      if (console && typeof console[safeLevel] === "function") {
        console[safeLevel](`${prefix} ${message}`);
      } else {
        // 降级到基础log方法
        console.log(`${prefix} [${safeLevel.toUpperCase()}] ${message}`);
      }
    } else if (isBrowser()) {
      // 浏览器环境，确保方法存在
      if (console && typeof console[safeLevel] === "function") {
        console[safeLevel](`${prefix} ${message}`);
      } else {
        // 降级到基础log方法
        console.log(`${prefix} [${safeLevel.toUpperCase()}] ${message}`);
      }
    } else {
      // 未知环境，使用最基础的输出
      if (console && console.log) {
        console.log(`${prefix} [${safeLevel.toUpperCase()}] ${message}`);
      }
    }
  } catch (error) {
    // 如果所有方法都失败，尝试最基础的输出
    try {
      console.log(`${prefix} [${safeLevel.toUpperCase()}] ${message}`);
    } catch (e) {
      // 完全静默失败，避免阻塞程序执行
    }
  }
};

/**
 * 兼容性错误处理
 * @param {Error} error - 错误对象
 * @param {string} context - 错误上下文
 */
export const handleCompatError = (error, context = "") => {
  const env = getEnvironment();
  const errorMessage = `${context ? `[${context}] ` : ""}${error.message}`;

  compatLog(`错误: ${errorMessage}`, "error");

  // 根据环境进行特殊处理
  if (env === "wechat") {
    // 微信小程序特殊错误处理
    if (error.message.includes("URL is not a constructor")) {
      compatLog("检测到URL构造函数不兼容问题，已使用兼容性实现", "warn");
    }
  }

  return {
    environment: env,
    message: errorMessage,
    originalError: error,
  };
};

/**
 * 环境特性检测
 * @returns {Object} 特性支持情况
 */
export const getEnvironmentFeatures = () => {
  const env = getEnvironment();

  return {
    environment: env,
    features: {
      fetch: typeof fetch !== "undefined",
      urlConstructor: typeof URL !== "undefined",
      abortController: typeof AbortController !== "undefined",
      wxRequest: typeof wx !== "undefined" && typeof wx.request === "function",
      wxLocation:
        typeof wx !== "undefined" && typeof wx.getLocation === "function",
      localStorage: typeof localStorage !== "undefined",
      sessionStorage: typeof sessionStorage !== "undefined",
    },
  };
};

/**
 * 兼容性初始化检查
 * 在应用启动时调用，检查环境兼容性
 */
export const initCompatibilityCheck = () => {
  const features = getEnvironmentFeatures();

  compatLog(`环境检测完成: ${features.environment}`, "log");
  compatLog(`特性支持: ${JSON.stringify(features.features, null, 2)}`, "log");

  // 检查关键特性
  if (features.environment === "wechat") {
    if (!features.features.wxRequest) {
      compatLog("警告: 微信小程序wx.request不可用", "warn");
    }
    if (!features.features.wxLocation) {
      compatLog("警告: 微信小程序wx.getLocation不可用", "warn");
    }
  } else if (features.environment === "browser") {
    if (!features.features.fetch) {
      compatLog("警告: 浏览器fetch API不可用", "warn");
    }
    if (!features.features.urlConstructor) {
      compatLog("警告: 浏览器URL构造函数不可用", "warn");
    }
  }

  return features;
};
