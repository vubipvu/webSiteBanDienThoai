import './Warranty.css'

export function Warranty() {
  return (
    <div className="page">
      <div className="container warranty">
        <div className="page-header">
          <h1>Chính sách bảo hành</h1>
          <p>
            ATM66 minh bạch thời hạn và phạm vi bảo hành theo từng loại sản phẩm. Mang máy + hóa đơn
            khi đến bảo hành.
          </p>
        </div>

        <div className="warranty-grid">
          <section>
            <h2>Điện thoại mới</h2>
            <ul>
              <li>Bảo hành chính hãng theo tem/phiếu (thường 12 tháng).</li>
              <li>Đổi mới trong 7 ngày nếu lỗi nhà sản xuất (máy chưa qua sửa chữa ngoài).</li>
              <li>Không bảo hành do vào nước, rơi vỡ, can thiệp phần mềm trái phép.</li>
            </ul>
          </section>
          <section>
            <h2>Điện thoại cũ</h2>
            <ul>
              <li>Bảo hành ATM66 3–6 tháng tùy gói (ghi trên hóa đơn).</li>
              <li>Bao gồm lỗi phần cứng phát sinh trong sử dụng bình thường.</li>
              <li>Pin: hỗ trợ kiểm tra; đổi pin tính phí ưu đãi nếu ngoài phạm vi.</li>
            </ul>
          </section>
          <section>
            <h2>Phụ kiện</h2>
            <ul>
              <li>Ốp / kính: đổi mới 7 ngày nếu lỗi sản xuất (chưa sử dụng trầy xước).</li>
              <li>Sạc, cáp, tai nghe: bảo hành 1–12 tháng theo hãng.</li>
              <li>Giữ hộp/tem để đối chiếu khi bảo hành.</li>
            </ul>
          </section>
        </div>

        <section className="warranty-note">
          <h2>Quy trình</h2>
          <ol>
            <li>Mang sản phẩm + hóa đơn đến ATM66 (hoặc gửi theo hướng dẫn hotline).</li>
            <li>Kỹ thuật tiếp nhận, kiểm tra trong 1–3 ngày làm việc.</li>
            <li>Sửa / đổi / hoàn tiền theo chính sách đã ghi trên hóa đơn.</li>
          </ol>
        </section>
      </div>
    </div>
  )
}
