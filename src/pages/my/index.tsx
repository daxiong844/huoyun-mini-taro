import { useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { api } from '../../api'
import './index.scss'

interface UserProfile {
  avatarUrl?: string
  name?: string
  phone?: string
  wechatId?: string
  verified?: boolean
  membershipLevel?: 'none' | 'monthly' | 'annual'
  monthlyPrice?: number
  annualPrice?: number
}

export default function MyPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooperations, setCooperations] = useState<any[]>([])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res: any = await api.get('/user/profile')
      setProfile(res || null)
    } catch (e) {
      Taro.showToast({ title: '加载用户信息失败', icon: 'none' })
    }
    setLoading(false)
  }

  useEffect(() => { fetchProfile() }, [])
  useDidShow(() => { fetchProfile() })

  const fetchCooperations = async () => {
    try {
      const res: any = await api.get('/user/cooperations')
      setCooperations(Array.isArray(res) ? res : [])
    } catch (e) {
      // 忽略错误
    }
  }

  useEffect(() => { fetchCooperations() }, [])
  useDidShow(() => { fetchCooperations() })

  const handleBindWechat = async () => {
    try {
      const res: any = await api.post('/user/wechat/bind', { body: { wechatId: '' } })
      if (res?.ok) {
        Taro.showToast({ title: '已绑定微信号', icon: 'success' })
        fetchProfile()
      }
    } catch (e) {
      Taro.showToast({ title: '绑定失败', icon: 'none' })
    }
  }

  const handleVerify = async () => {
    try {
      const res: any = await api.post('/user/verify')
      if (res?.ok) {
        Taro.showToast({ title: '实名认证成功', icon: 'success' })
        fetchProfile()
      }
    } catch (e) {
      Taro.showToast({ title: '实名认证失败', icon: 'none' })
    }
  }

  const handlePurchase = async (level: 'monthly' | 'annual') => {
    try {
      const res: any = await api.post('/user/membership/purchase', { body: { level } })
      if (res?.ok) {
        Taro.showToast({ title: '购买成功', icon: 'success' })
        fetchProfile()
      } else {
        Taro.showToast({ title: res?.error || '购买失败', icon: 'none' })
      }
    } catch (e) {
      Taro.showToast({ title: '购买失败', icon: 'none' })
    }
  }

  return (
    <View className="my-page">
      <View className="my-hero">
        <Text className="hero-title">我的</Text>
        <Text className="hero-subtitle">查看账户信息与会员情况</Text>
      </View>

      <View className="profile-card">
        <View className="profile-header">
          {profile?.avatarUrl ? (
            <Image className="avatar" src={profile.avatarUrl} mode="aspectFill" />
          ) : (
            <View className="avatar placeholder">👤</View>
          )}
          <View className="basic">
            <Text className="name">{profile?.name || '未设置姓名'}</Text>
            <Text className="phone">{profile?.phone || '未设置手机号'}</Text>
          </View>
        </View>

        <View className="info-list">
          <View className="info-row">
            <Text className="label">微信号</Text>
            <View className="value">
              <Text>{profile?.wechatId ? profile.wechatId : '未绑定'}</Text>
              {!profile?.wechatId && (
                <AtButton size="small" className="inline-btn" onClick={handleBindWechat}>去绑定</AtButton>
              )}
            </View>
          </View>
          <View className="info-row">
            <Text className="label">实名认证</Text>
            <View className="value">
              <Text>{profile?.verified ? '已实名' : '未实名'}</Text>
              {!profile?.verified && (
                <AtButton size="small" className="inline-btn" onClick={handleVerify}>去实名</AtButton>
              )}
            </View>
          </View>
          <View className="info-row">
            <Text className="label">会员级别</Text>
            <View className="value">
              <Text>{profile?.membershipLevel === 'monthly' ? '月度会员' : profile?.membershipLevel === 'annual' ? '年度会员' : '非会员'}</Text>
            </View>
          </View>
        </View>
      </View>

      {(!profile || profile.membershipLevel === 'none') && (
        <View className="membership-card">
          <Text className="card-title">开通会员</Text>
          <View className="plans">
            <View className="plan-item">
              <Text className="plan-name">月费</Text>
              <Text className="plan-price">¥{profile?.monthlyPrice ?? 99}</Text>
              <AtButton type="primary" className="plan-btn" onClick={() => handlePurchase('monthly')}>购买月度会员</AtButton>
            </View>
            <View className="plan-item">
              <Text className="plan-name">年费</Text>
              <Text className="plan-price">¥{profile?.annualPrice ?? 899}</Text>
              <AtButton type="primary" className="plan-btn" onClick={() => handlePurchase('annual')}>购买年度会员</AtButton>
            </View>
          </View>
        </View>
      )}

      {/* 合作记录（默认展示3条） */}
      <View className="cooperation-card">
        <View className="cooperation-header">
          <Text className="card-title">合作记录</Text>
          <AtButton size="small" className="more-btn" onClick={() => Taro.navigateTo({ url: '/pages/cooperation-list/index' })}>更多</AtButton>
        </View>
        <View className="coop-list">
          {(cooperations || []).slice(0, 3).map((item) => (
            <View className="coop-item" key={item.id}>
              <View className="coop-left">
                <Text className="coop-partner">司机：{item.driverName || '-'}</Text>
                <Text className="coop-phone">手机号：{item.driverPhone || '-'}</Text>
                <Text className="coop-vehicle-type">车辆类型：{item.vehicleType || '-'}</Text>
                <Text className="coop-vehicle-brand">车辆品牌：{item.vehicleBrand || '-'}</Text>
              </View>
              <View className="coop-right">
                <Text className="coop-count">合作次数：{item.coopCount ?? '-'}</Text>
                <Text className="coop-date">最近一次：{item.lastCoopAt ? new Date(item.lastCoopAt).toLocaleDateString() : '-'}</Text>
              </View>
            </View>
          ))}
          {(!cooperations || cooperations.length === 0) && (
            <Text className="empty">暂无合作记录</Text>
          )}
        </View>
      </View>

      {loading && <Text className="loading">加载中...</Text>}
    </View>
  )
}