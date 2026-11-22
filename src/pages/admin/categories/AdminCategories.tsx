import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../../lib/api'
import './AdminCategories.css'

type Cat = {
  id: string
  name: string
  description: string
  sort_order: number
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Cat[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    sort_order: '0',
  })

  const load = () =>
    api<{ categories: Cat[] }>('/api/admin/categories')
      .then((d) => setCategories(d.categories))
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi'))

  useEffect(() => {
    void load()
  }, [])

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          sort_order: Number(form.sort_order),
        }),
      })
      setForm({ id: '', name: '', description: '', sort_order: '0' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được')
    }
  }

  const remove = async (id: string) => {
    if (!confirm(`Xóa danh mục ${id}?`)) return
    try {
      await api(`/api/admin/categories/${id}`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được')
    }
  }

  return (
    <div className="admin-cats">
      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2>Thêm danh mục</h2>
        </div>
        <form className="admin-form" onSubmit={onCreate}>
          <input
            placeholder="id (vd: tablet)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            required
          />
          <input
            placeholder="Tên hiển thị"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Mô tả"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Thứ tự"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
          <button type="submit" className="btn btn-accent">
            Thêm
          </button>
        </form>
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2>Danh mục sản phẩm</h2>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>TT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.description}</td>
                  <td>{c.sort_order}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={() => void remove(c.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
