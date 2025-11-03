import { Component, PropsWithChildren } from "react";
import Taro from "@tarojs/taro";
import { View, Input, ScrollView } from "@tarojs/components";
import { getInputTips } from "../../services/amap";
import "./index.scss";

// 本地历史记录存储 KEY
const HISTORY_STORAGE_KEY = "search_location_history";

// 定义地点数据结构
interface LocationItem {
  id: string;
  name: string;
  address: string;
  district: string;
  adcode: string;
  location: string;
  coordinates?: {
    longitude: number;
    latitude: number;
  };
  formattedAddress: string;
}

// 页面状态类型
type State = {
  searchKeywords: string; // 搜索关键词
  searchResults: LocationItem[]; // 搜索结果列表
  loading: boolean; // 加载状态
  currentCity: string; // 当前城市
  searchType: "start" | "end"; // 搜索类型：起点或终点
  historyRecords: LocationItem[]; // 历史记录（最多10条）
};

export default class SearchLocation extends Component<
  PropsWithChildren,
  State
> {
  private searchTimer: NodeJS.Timeout | null = null; // 防抖定时器

  state: State = {
    searchKeywords: "",
    searchResults: [],
    loading: false,
    currentCity: "北京", // 默认城市
    searchType: "start",
    historyRecords: [],
  };

  async componentDidMount() {
    // 获取页面参数
    const params = Taro.getCurrentInstance().router?.params;
    if (params) {
      const { type, keywords, city } = params as Record<string, any>;
      // 如果URL中包含中文参数，可能被编码，这里统一做解码处理
      const decodedKeywords =
        typeof keywords === "string" ? decodeURIComponent(keywords) : "";
      const decodedCity =
        typeof city === "string" ? decodeURIComponent(city) : undefined;

      this.setState({
        searchType: (type as "start" | "end") || "start",
        searchKeywords: decodedKeywords,
        currentCity: decodedCity || "北京",
      });
      console.log("currentCity:", this.state.currentCity);

      // 如果有初始关键词，立即搜索（使用解码后的关键词）
      if (decodedKeywords && decodedKeywords.trim()) {
        this.performSearch(decodedKeywords.trim());
      }
    }

    // 尝试获取当前位置城市
    this.getCurrentCity();

    // 加载历史记录
    await this.loadHistory();
  }

  componentWillUnmount() {
    // 清理定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  /**
   * 获取当前城市
   */
  getCurrentCity = async () => {
    try {
      const location = await Taro.getLocation({ type: "gcj02" });
      // 这里可以通过逆地理编码获取城市名称
      // 暂时使用默认城市
      console.log("当前位置:", location);
    } catch (error) {
      console.warn("获取位置失败:", error);
    }
  };

  /**
   * 搜索框输入变化处理
   */
  onSearchInput = (e: any) => {
    const keywords = e.detail.value;
    this.setState({ searchKeywords: keywords });

    // 防抖处理：延迟300ms后执行搜索
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => {
      if (keywords.trim()) {
        this.performSearch(keywords.trim());
      } else {
        this.setState({ searchResults: [] });
      }
    }, 300);
  };

  /**
   * 执行搜索
   */
  performSearch = async (keywords: string) => {
    if (!keywords.trim()) {
      return;
    }

    this.setState({ loading: true });

    try {
      // 使用输入提示API进行地址提示搜索（与 useInputTips 逻辑一致）
      const result = await getInputTips({
        keywords: keywords,
      });

      if (result.success && result.tips) {
        // 转换数据格式
        const searchResults: LocationItem[] = result.tips.map((tip: any) => ({
          id: tip.id || `${tip.location}_${Date.now()}`,
          name: tip.name || keywords,
          address: tip.address || "",
          district: tip.district || "",
          adcode: tip.adcode || "",
          location: tip.location || "",
          coordinates: tip.coordinates || undefined,
          formattedAddress:
            tip.formattedAddress || `${tip.district} ${tip.address}`.trim(),
        }));

        this.setState({
          searchResults,
          loading: false,
        });
      } else {
        this.setState({
          searchResults: [],
          loading: false,
        });
      }
    } catch (error) {
      console.error("搜索失败:", error);
      this.setState({
        searchResults: [],
        loading: false,
      });

      Taro.showToast({
        title: "搜索失败，请重试",
        icon: "none",
        duration: 2000,
      });
    }
  };

  /**
   * 选择搜索结果
   */
  onSelectLocation = (location: LocationItem) => {
    // 通过全局数据传递选中的地点信息
    const app = Taro.getApp();
    if (!app.globalData) {
      app.globalData = {};
    }

    // 存储选中的地点数据
    app.globalData.selectedLocation = {
      type: this.state.searchType,
      name: location.name,
      longitude: location.coordinates?.longitude || 0,
      latitude: location.coordinates?.latitude || 0,
    };

    // 保存到本地历史记录（最多保留10条，去重）
    this.saveHistory(location);

    Taro.navigateBack();
  };

  /**
   * 加载本地历史记录
   */
  loadHistory = async () => {
    try {
      // 使用同步接口以避免闪烁
      const records = Taro.getStorageSync(HISTORY_STORAGE_KEY) as
        | LocationItem[]
        | undefined;
      const history = Array.isArray(records) ? records : [];
      // 只保留前10条
      this.setState({ historyRecords: history.slice(0, 10) });
    } catch (error) {
      console.warn("加载历史记录失败:", error);
      this.setState({ historyRecords: [] });
    }
  };

  /**
   * 保存历史记录（插入到最前，去重并限制10条）
   */
  saveHistory = (location: LocationItem) => {
    try {
      const current = Taro.getStorageSync(HISTORY_STORAGE_KEY) as
        | LocationItem[]
        | undefined;
      const list = Array.isArray(current) ? current : [];

      const makeKey = (x: LocationItem) => {
        const coordKey = x.coordinates
          ? `${x.coordinates.longitude},${x.coordinates.latitude}`
          : x.location || "";
        return `${x.name}|${coordKey}`;
      };

      const newItem: LocationItem = {
        id: location.id,
        name: location.name,
        address: location.address || "",
        district: location.district || "",
        adcode: location.adcode || "",
        location: location.location || "",
        coordinates: location.coordinates,
        formattedAddress:
          location.formattedAddress ||
          `${location.district} ${location.address}`.trim(),
      };

      // 将新项插入到最前并去重
      const merged = [newItem, ...list].filter((item, index, arr) => {
        const key = makeKey(item);
        return arr.findIndex((it) => makeKey(it) === key) === index;
      });

      const limited = merged.slice(0, 10);
      Taro.setStorageSync(HISTORY_STORAGE_KEY, limited);
      this.setState({ historyRecords: limited });
    } catch (error) {
      console.warn("保存历史记录失败:", error);
    }
  };

  /**
   * 清空历史记录
   */
  clearHistory = async () => {
    try {
      await Taro.removeStorage({ key: HISTORY_STORAGE_KEY });
    } catch (error) {
      // 兼容处理
      try {
        Taro.setStorageSync(HISTORY_STORAGE_KEY, []);
      } catch (_) {}
    }
    this.setState({ historyRecords: [] });
    Taro.showToast({ title: "已清空历史记录", icon: "none", duration: 1500 });
  };

  /**
   * 点击历史记录：将名称填入搜索框并直接发起搜索
   */
  onClickHistoryKeyword = (name: string) => {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
    this.setState({ searchKeywords: name });
    const kw = (name || "").trim();
    if (kw) {
      this.performSearch(kw);
    }
  };

  /**
   * 清空搜索
   */
  onClearSearch = () => {
    this.setState({
      searchKeywords: "",
      searchResults: [],
    });
  };

  /**
   * 返回上一页
   */
  onGoBack = () => {
    Taro.navigateBack();
  };

  render() {
    const {
      searchKeywords,
      searchResults,
      loading,
      searchType,
      historyRecords,
    } = this.state;

    return (
      <View className="search-location">
        {/* 顶部搜索栏 */}
        <View className="search-header">
          <View className="search-bar">
            <View className="back-button" onClick={this.onGoBack}>
              <View className="back-icon">←</View>
            </View>
            <View className="search-input-wrapper">
              <Input
                className="search-input"
                type="text"
                placeholder={`请输入${
                  searchType === "start" ? "起点" : "终点"
                }位置`}
                value={searchKeywords}
                onInput={this.onSearchInput}
                focus
                confirmType="search"
              />
              {searchKeywords && (
                <View className="clear-button" onClick={this.onClearSearch}>
                  <View className="clear-icon">×</View>
                </View>
              )}
            </View>
          </View>
        </View>

        <View>
          {/* 历史记录 */}
          {historyRecords.length > 0 && (
            <View className="history-section">
              <View className="history-header">
                <View className="history-title">历史记录</View>
                <View
                  className="clear-history-button"
                  onClick={this.clearHistory}
                >
                  清空
                </View>
              </View>
              <ScrollView className="history-list" scrollX>
                {historyRecords.map((item) => (
                  <View
                    key={`his_${item.id}`}
                    className="history-chip"
                    onClick={() => this.onClickHistoryKeyword(item.name)}
                  >
                    {item.name}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 搜索结果列表 */}
        <ScrollView className="search-results" scrollY>
          {/* 无输入时的占位提示 */}
          {!searchKeywords && (
            <View className="placeholder-container">
              <View className="placeholder-icon">📍</View>
              <View className="placeholder-text">
                输入地点名称或地址进行搜索
              </View>
              <View className="placeholder-hint">
                支持搜索POI、地址、公交站等
              </View>
            </View>
          )}

          {loading && (
            <View className="loading-container">
              <View className="loading-text">搜索中...</View>
            </View>
          )}

          {!loading && searchResults.length === 0 && searchKeywords && (
            <View className="empty-container">
              <View className="empty-icon">🔍</View>
              <View className="empty-text">未找到相关地点</View>
              <View className="empty-hint">请尝试其他关键词</View>
            </View>
          )}

          {!loading && searchResults.length > 0 && (
            <View className="results-list">
              {searchResults.map((item, index) => (
                <View
                  key={item.id}
                  className="result-item"
                  onClick={() => this.onSelectLocation(item)}
                >
                  <View className="item-icon">📍</View>
                  <View className="item-content">
                    <View className="item-name">{item.name}</View>
                    <View className="item-address">
                      {item.formattedAddress}
                    </View>
                    {item.coordinates && (
                      <View className="item-coordinates">
                        经度: {item.coordinates.longitude.toFixed(6)}, 纬度:{" "}
                        {item.coordinates.latitude.toFixed(6)}
                      </View>
                    )}
                  </View>
                  <View className="item-arrow">→</View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }
}
