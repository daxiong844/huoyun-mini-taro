import { useEffect, useState } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { api } from '../../api'
import './index.scss'

export default function OrderDetailPage() {
  const [id, setId] = useState<number | null>(null)
  const [order, setOrder] = useState<any>(null)

  useLoad((options) => {
    if (options?.id) {
      setId(Number(options.id))
    }
  })

  useEffect(() => {
    const fetchOne = async () => {
      if (!id) return
      try {
        const res: any = await api.get('/shipping/orders', { query: { id } })
        setOrder(res?.data || null)
      } catch (e) {
        Taro.showToast({ title: '加载失败', icon: 'none' })
      }
    }
    fetchOne()
  }, [id])

  if (!order) {
    return <View className="order-detail-page"><Text>数据加载中或不存在</Text></View>
  }

  return (
    <View className="order-detail-page">
      {/* 顶部状态区 */}
      <View className="detail-hero">
        <View className="state-block">
          <Text className="state-title">{order.status || '—'}</Text>
        </View>
      </View>

      <View className="contact-card">
        <View className="contact-row">
          <Text className="contact-icon">📍</Text>
          <Text className="contact-name">装货地址</Text>
        </View>
        <Text className="contact-address">{order.origin || '未提供地址'}</Text>
        <View className="contact-row">
          <Text className="contact-icon">🕒</Text>
          <Text className="contact-name">装货时间</Text>
        </View>
        <Text className="contact-address">{order.loadDate ? String(order.loadDate) : '—'}</Text>
      </View>

      <View className="contact-card">
        <View className="contact-row">
          <Text className="contact-icon">📍</Text>
          <Text className="contact-name">卸货地址</Text>
        </View>
        <Text className="contact-address">{order.destination || '未提供地址'}</Text>
         <View className="contact-row">
          <Text className="contact-icon">🕒</Text>
          <Text className="contact-name">卸货时间</Text>
        </View>
        <Text className="contact-address">{order.unloadDate ? String(order.unloadDate) : '—'}</Text>
      </View>

      {/* 信息灰底块 */}
      <View className="info-box">
        <View className="info-row">
          <Text className="info-label">运单号</Text>
          <View className="info-value">
            <Text>{order.id}</Text>
            <Text className="copy-link" onClick={() => Taro.setClipboardData({ data: String(order.id) }).then(() => Taro.showToast({ title: '订单号已复制', icon: 'none' }))}>复制</Text>
          </View>
        </View>
        <View className="info-row">
          <Text className="info-label">货物名称</Text>
          <Text className="info-value">{order.cargoName || '—'}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">重量</Text>
          <Text className="info-value">{order.weight != null ? `${order.weight} ${order.weightUnit || ''}` : '—'}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">方数</Text>
          <Text className="info-value">{order.volume != null ? `${order.volume} ${order.volumeUnit || ''}` : '—'}</Text>
        </View>
        
        <View className="info-row">
          <Text className="info-label">计价单位</Text>
          <Text className="info-value">{order.pricingUnit || '—'}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">价格方案</Text>
          <Text className="info-value">{order.plan ? (order.plan === 'single' ? '单次计费' : order.plan === 'monthly' ? '月度套餐' : '年度套餐') : '—'}</Text>
        </View>
      </View>
      
    </View>
  )
}