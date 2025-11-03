import { useState, useEffect, useRef, useCallback } from "react";
import { getInputTips } from "../services/amap";

/**
 * 微信小程序兼容的AbortController实现
 * 由于微信小程序不支持原生AbortController，提供简单的替代实现
 */
class MiniProgramAbortController {
  constructor() {
    this.aborted = false;
    this.signal = {
      aborted: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }

  abort() {
    this.aborted = true;
    this.signal.aborted = true;
  }
}

// 检测环境并使用合适的AbortController
const getAbortController = () => {
  if (typeof AbortController !== "undefined") {
    return new AbortController();
  }
  return new MiniProgramAbortController();
};

/**
 * 输入提示自定义Hook
 * 功能：
 * 1. 管理输入提示的状态
 * 2. 实现防抖搜索
 * 3. 处理API调用和错误处理
 * 4. 提供便捷的操作方法
 * 5. 兼容微信小程序环境
 */
export const useInputTips = (options = {}) => {
  const {
    debounceDelay = 300, // 防抖延迟时间（毫秒）
    city = "北京", // 默认搜索城市
    minKeywordLength = 2, // 最小关键词长度
    maxResults = 10, // 最大结果数量
    autoSearch = true, // 是否自动搜索
    onError = null, // 错误回调
    onSuccess = null, // 成功回调
  } = options;

  // 状态管理
  const [tips, setTips] = useState([]); // 提示列表
  const [loading, setLoading] = useState(false); // 加载状态
  const [error, setError] = useState(null); // 错误信息
  const [visible, setVisible] = useState(false); // 提示框可见性

  // 引用管理
  const debounceTimerRef = useRef(null); // 防抖定时器
  const currentRequestRef = useRef(null); // 当前请求标识
  const abortControllerRef = useRef(null); // 请求取消控制器

  /**
   * 清理防抖定时器
   */
  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  /**
   * 取消当前请求
   */
  const cancelCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * 执行搜索
   * @param {string} keywords - 搜索关键词
   * @param {Object} searchOptions - 搜索选项
   */
  const performSearch = useCallback(
    async (keywords, searchOptions = {}) => {
      // 取消之前的请求
      cancelCurrentRequest();

      // 创建新的请求控制器（兼容微信小程序）
      abortControllerRef.current = getAbortController();
      const requestId = Date.now();
      currentRequestRef.current = requestId;

      try {
        setLoading(true);
        setError(null);

        console.log("开始搜索输入提示:", keywords);

        // 构建搜索参数
        const searchParams = {
          keywords: keywords.trim(),
          city,
          datatype: "all",
          ...searchOptions,
        };

        // 调用API
        const result = await getInputTips(searchParams);

        // 检查请求是否已被取消或过期
        if (currentRequestRef.current !== requestId) {
          console.log("请求已过期，忽略结果");
          return;
        }

        if (result && result.success) {
          const resultTips = result.tips || [];

          // 限制结果数量
          const limitedTips = resultTips.slice(0, maxResults);

          setTips(limitedTips);
          setVisible(limitedTips.length > 0);

          console.log(`搜索成功，找到 ${limitedTips.length} 个结果`);

          // 成功回调
          if (onSuccess) {
            onSuccess(limitedTips, keywords);
          }
        } else {
          console.warn("搜索失败:", result?.error || "未知错误");
          setTips([]);
          setVisible(false);
          setError(result?.error || "搜索失败");
        }
      } catch (err) {
        // 检查是否是取消的请求（兼容微信小程序）
        if (
          err.name === "AbortError" ||
          (abortControllerRef.current && abortControllerRef.current.aborted)
        ) {
          console.log("请求已取消");
          return;
        }

        console.error("搜索输入提示失败:", err);

        setTips([]);
        setVisible(false);
        setError(err.message || "网络请求失败");

        // 错误回调
        if (onError) {
          onError(err, keywords);
        }
      } finally {
        // 只有当前请求才更新loading状态
        if (currentRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [city, maxResults, onError, onSuccess, cancelCurrentRequest]
  );

  /**
   * 防抖搜索
   * @param {string} keywords - 搜索关键词
   * @param {Object} searchOptions - 搜索选项
   */
  const debouncedSearch = useCallback(
    (keywords, searchOptions = {}) => {
      // 清理之前的定时器
      clearDebounceTimer();

      // 如果关键词为空或长度不足，清空结果
      if (!keywords || keywords.trim().length < minKeywordLength) {
        setTips([]);
        setVisible(false);
        setError(null);
        cancelCurrentRequest();
        return;
      }

      // 设置新的防抖定时器
      debounceTimerRef.current = setTimeout(() => {
        if (autoSearch) {
          performSearch(keywords, searchOptions);
        }
      }, debounceDelay);
    },
    [
      debounceDelay,
      minKeywordLength,
      autoSearch,
      performSearch,
      clearDebounceTimer,
      cancelCurrentRequest,
    ]
  );

  /**
   * 立即搜索（不防抖）
   * @param {string} keywords - 搜索关键词
   * @param {Object} searchOptions - 搜索选项
   */
  const searchImmediately = useCallback(
    (keywords, searchOptions = {}) => {
      clearDebounceTimer();

      if (!keywords || keywords.trim().length < minKeywordLength) {
        setTips([]);
        setVisible(false);
        setError(null);
        return;
      }

      performSearch(keywords, searchOptions);
    },
    [performSearch, clearDebounceTimer, minKeywordLength]
  );

  /**
   * 隐藏提示框
   */
  const hideTips = useCallback(() => {
    setVisible(false);
  }, []);

  /**
   * 显示提示框
   */
  const showTips = useCallback(() => {
    if (tips.length > 0) {
      setVisible(true);
    }
  }, [tips.length]);

  /**
   * 清空提示
   */
  const clearTips = useCallback(() => {
    clearDebounceTimer();
    cancelCurrentRequest();
    setTips([]);
    setVisible(false);
    setError(null);
    setLoading(false);
  }, [clearDebounceTimer, cancelCurrentRequest]);

  /**
   * 重试搜索
   * @param {string} keywords - 搜索关键词
   * @param {Object} searchOptions - 搜索选项
   */
  const retrySearch = useCallback(
    (keywords, searchOptions = {}) => {
      setError(null);
      searchImmediately(keywords, searchOptions);
    },
    [searchImmediately]
  );

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      clearDebounceTimer();
      cancelCurrentRequest();
    };
  }, [clearDebounceTimer, cancelCurrentRequest]);

  return {
    // 状态
    tips,
    loading,
    error,
    visible,

    // 操作方法
    search: debouncedSearch, // 防抖搜索
    searchImmediately, // 立即搜索
    hideTips, // 隐藏提示
    showTips, // 显示提示
    clearTips, // 清空提示
    retrySearch, // 重试搜索

    // 工具方法
    setVisible,

    // 统计信息
    hasResults: tips.length > 0,
    resultCount: tips.length,
  };
};
