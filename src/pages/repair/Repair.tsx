import { Link } from 'react-router-dom'
import { ZaloQrCard } from '../../components/ZaloQrCard'
import { useAppearance } from '../../context/AppearanceContext'
import './Repair.css'

const PROMISES = [
  {
    title: 'Báo giá trước khi sửa',
    body: 'Kiểm tra máy, nói rõ lỗi và chi phí — bạn đồng ý rồi mới làm.',
  },
  {
    title: 'Linh kiện rõ nguồn',
    body: 'Ưu tiên linh kiện tương thích tốt; ghi nhận loại thay thế trước khi lắp.',
  },
  {
    title: 'Không phí ẩn',
    body: 'Không phát sinh ngoài báo giá đã thống nhất (trừ khi bạn yêu cầu thêm hạng mục).',
  },
  {
    title: 'Bảo hành sau sửa',
    body: 'Hạng mục đã sửa được bảo hành theo thỏa thuận tại quầy — ghi rõ trên phiếu.',
  },
  {
    title: 'Giữ dữ liệu khi có thể',
    body: 'Ưu tiên sửa không mất dữ liệu; nếu phải reset sẽ báo trước.',
  },
  {
    title: 'Hỗ trợ Zalo sau bán',
    body: 'Máy vừa sửa xong vẫn nhắn được shop nếu cần hỗ trợ thêm.',
  },
]

const SERVICES = [
  'Điện thoại (iPhone / Android)',
  'iPad / tablet',
  'Laptop (phần mềm, pin, màn…)',
  'Thay màn / cảm ứng / pin / sạc',
  'Face ID, loa, mic, camera',
  'Vào nước / ẩm · lên phần mềm',
]

const STEPS = [
  {
    n: '01',
    title: 'Quét QR hoặc nhắn Zalo',
    body: 'Mở Zalo quét mã bên dưới — hoặc bấm Nhắn tin để chat trực tiếp.',
  },
  {
    n: '02',
    title: 'Kiểm tra & báo giá',
    body: 'Kỹ thuật xem máy, báo rõ chi phí và thời gian trước khi sửa.',
  },
  {
    n: '03',
    title: 'Sửa & bàn giao',
    body: 'Sửa theo thỏa thuận, kiểm tra lại trước khi trả máy.',
  },
]

export function Repair() {
  const { appearance } = useAppearance()
  const phone = appearance.zaloPhone
  const contact = appearance.contactName || 'Cô Long'
  const zaloHref = `${appearance.zaloUrl}?text=${encodeURIComponent(
    `Xin chào ATM66 Mobile, mình cần hỗ trợ sửa máy / tư vấn.`,
  )}`

  return (
    <div className="page repair-page">
      <section className="repair-hero">
        <div className="container repair-hero__grid">
          <div className="repair-hero__copy">
            <p className="repair-hero__eyebrow">Sửa máy · Zalo</p>
            <h1>Sửa chữa uy tín — điện thoại, iPad, laptop.</h1>
            <p className="repair-hero__lead">
              📱 ATM66 Mobile — THU MUA máy cũ giá cao + BÁN máy Zin + SỬA CHỮA uy tín: điện thoại,
              iPad, laptop…
            </p>
            <p className="repair-hero__sub">
              Không đặt lịch online. Quét QR hoặc nhắn Zalo {contact}.
            </p>
            <div className="repair-hero__actions">
              <a className="btn btn-accent" href={zaloHref} target="_blank" rel="noopener noreferrer">
                Nhắn tin Zalo
              </a>
              <a className="btn btn-ghost" href={`tel:${phone.replace(/\s+/g, '')}`}>
                Gọi {phone}
              </a>
            </div>
          </div>

          <ZaloQrCard message="Xin chào ATM66 Mobile, mình cần hỗ trợ sửa máy / tư vấn." />
        </div>
      </section>

      <div className="container">
        <section className="repair-block">
          <h2>Cam kết khi sửa tại ATM66</h2>
          <p className="repair-block__lead">
            Mục tiêu đơn giản: khách hiểu mình đang trả tiền cho gì — và máy về dùng ổn.
          </p>
          <div className="repair-promises">
            {PROMISES.map((p) => (
              <article key={p.title} className="repair-promise">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="repair-block repair-split">
          <div>
            <h2>Nhận sửa những gì?</h2>
            <ul className="repair-services">
              {SERVICES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Quy trình 3 bước</h2>
            <ol className="repair-steps">
              {STEPS.map((s) => (
                <li key={s.n}>
                  <strong>{s.n}</strong>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="repair-cta-band">
          <div>
            <h2>Cần sửa / thu mua / hỏi máy?</h2>
            <p>
              Zalo {contact}: <strong>{phone}</strong>
              <br />
              {appearance.shopAddress}
            </p>
          </div>
          <div className="repair-cta-band__actions">
            <a className="btn btn-accent" href={zaloHref} target="_blank" rel="noopener noreferrer">
              Nhắn Zalo ngay
            </a>
            <Link to="/gioi-thieu" className="btn btn-ghost">
              Xem bản đồ
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
