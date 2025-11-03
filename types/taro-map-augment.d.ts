// 让 CoverView 支持在 Map 组件中用于自定义气泡（customCallout）的扩展属性
// 注意：必须以“模块增强（augmentation）”方式引入原模块，避免覆盖 @tarojs/components 的现有导出（如 View、Map、CoverView 等）
// 参考文档：https://developers.weixin.qq.com/miniprogram/dev/component/map.html#marker-%E4%B8%8A%E7%9A%84%E8%87%AA%E5%AE%9A%E4%B9%89%E6%B0%94%E6%B3%A1-customCallout
import '@tarojs/components'
declare module '@tarojs/components' {
  // 仅扩展原有 CoverViewProps，不改变其余导出
  interface CoverViewProps {
    /** 关联到 Map 标记点的 id，用于渲染对应 marker 的自定义气泡 */
    markerId?: number
    /** 在 Map 中使用的插槽，设置为 'callout' 以作为自定义气泡内容 */
    slot?: string
  }
}