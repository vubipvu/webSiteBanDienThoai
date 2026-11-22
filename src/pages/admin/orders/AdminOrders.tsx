import { useEffect, useState } from 'react'
import { api, formatVnd } from '../../../lib/api'
import './AdminOrders.css'

type Order = {
  id: string
  customer: string
  total: number
  status: string
  items: number
  created_at: string
}

const statuses = ['Chờ xác nhận', 'Đã thanh toán', 'Đang giao', 'Hoàn tất']

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')

  const load = () =>
    api<{ orders: Order[] }>('/api/admin/orders')
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi'))

  useEffect(() => {
    void load()
  }, [])

  const setStatus = async (id: string, status: string) => {
    await api(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    await load()
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <h2>Đơn hàng</h2>
      </div>
      {error && <p className="admin-error">{error}</p>}
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Khách</th>
              <th>SP</th>
              <th>Tổng</th>
              <th>Trạng thái</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.customer}</td>
                <td>{o.items}</td>
                <td>{formatVnd(o.total)}</td>
                <td>
                  <select
                    className="admin-order-status"
                    value={o.status}
                    onChange={(e) => void setStatus(o.id, e.target.value)}
                  >
                    {[o.status, ...statuses.filter((s) => s !== o.status)].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ),
                    )}
                  </select>
                </td>
                <td>{o.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
