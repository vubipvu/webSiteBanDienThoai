import {
  dashboardOrders,
  formatVnd,
  products,
} from '../../data/products'
import './Dashboard.css'

export function Dashboard() {
  const lowStock = [...products].sort((a, b) => a.stock - b.stock).slice(0, 5)
  const popular = products.filter((p) => p.popular)
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)
  const orderTotal = dashboardOrders.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="page dashboard">
      <div className="container">
        <div className="page-header">
          <span className="badge badge-warm">Admin / Vận hành</span>
          <h1>Dashboard cửa hàng</h1>
          <p>
            Tổng quan đơn hàng, tồn kho và mặt hàng phổ biến — khu vực nội bộ cho đội vận hành ATM66.
          </p>
        </div>

        <div className="dash-kpis">
          <div className="dash-kpi">
            <span>Đơn hôm nay</span>
            <strong>{dashboardOrders.length}</strong>
          </div>
          <div className="dash-kpi">
            <span>Doanh thu đơn mẫu</span>
            <strong>{formatVnd(orderTotal)}</strong>
          </div>
          <div className="dash-kpi">
            <span>SKU đang bán</span>
            <strong>{products.length}</strong>
          </div>
          <div className="dash-kpi">
            <span>Giá trị tồn (ước tính)</span>
            <strong>{formatVnd(inventoryValue)}</strong>
          </div>
        </div>

        <div className="dash-grid">
          <section className="dash-panel">
            <h2>Đơn hàng gần đây</h2>
            <div className="dash-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Khách</th>
                    <th>SP</th>
                    <th>Tổng</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardOrders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.items}</td>
                      <td>{formatVnd(order.total)}</td>
                      <td>
                        <span className={`dash-status dash-status--${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dash-panel">
            <h2>Tồn thấp cần chú ý</h2>
            <ul className="dash-list">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <strong className={p.stock < 10 ? 'is-low' : ''}>{p.stock} sp</strong>
                </li>
              ))}
            </ul>
          </section>

          <section className="dash-panel dash-panel--wide">
            <h2>Mặt hàng phổ biến</h2>
            <ul className="dash-popular">
              {popular.map((p) => (
                <li key={p.id}>
                  <img src={p.image} alt="" />
                  <div>
                    <strong>{p.name}</strong>
                    <span>{formatVnd(p.price)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

function statusClass(status: string) {
  if (status.includes('Hoàn')) return 'done'
  if (status.includes('Chờ')) return 'wait'
  if (status.includes('giao')) return 'ship'
  return 'paid'
}
