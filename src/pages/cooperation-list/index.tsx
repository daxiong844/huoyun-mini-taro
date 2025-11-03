import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { api } from '../../api'
import './index.scss'

interface CooperationItem {
  id: number
  partner?: string
  project?: string
  date?: number
  amount?: number
  summary?: string
  driverName?: string
  driverPhone?: string
  vehicleInfo?: string
  vehicleType?: string
  vehicleBrand?: string
  licensePlate?: string
  coopCount?: number
  lastCoopAt?: number
}

export default function CooperationListPage() {
  const [list, setList] = useState<CooperationItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchList = async () => {
    setLoading(true)
    try {
      const res: any = await api.get('/user/cooperations')
      setList(Array.isArray(res) ? res : [])
    } catch (e) {
      Taro.showToast({ title: '加载合作记录失败', icon: 'none' })
    }
    setLoading(false)
  }

  useEffect(() => { fetchList() }, [])
  useDidShow(() => { fetchList() })

  return (
    <View className="coop-page">
      <View className="coop-header">
        <Text className="title">合作记录列表</Text>
        <Text className="subtitle">查看历史合作伙伴与项目记录</Text>
      </View>

      <View className="coop-list">
        {list.map(item => (
          <View className="coop-item" key={item.id}>
            <View className="left">
              <Text className="driver">司机：{item.driverName || '-'}</Text>
              <Text className="phone">手机号：{item.driverPhone || '-'}</Text>
              <Text className="vehicle-type">车辆类型：{item.vehicleType || '-'}</Text>
              <Text className="vehicle-brand">车辆品牌：{item.vehicleBrand || '-'}</Text>
            </View>
            <View className="right">
              <Text className="count">合作次数：{item.coopCount ?? '-'}</Text>
              <Text className="last">最近一次：{item.lastCoopAt ? new Date(item.lastCoopAt).toLocaleDateString() : '-'}</Text>
            </View>
          </View>
        ))}
        {(!list || list.length === 0) && (
          <Text className="empty">暂无合作记录</Text>
        )}
      </View>

      {loading && <Text className="loading">加载中...</Text>}
    </View>
  )
}