import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppearanceProvider } from './context/AppearanceContext'
import { Layout } from './components/Layout'
import { Home } from './pages/home/Home'
import { Products } from './pages/products/Products'
import { ProductDetail } from './pages/product-detail/ProductDetail'
import { SitePage } from './pages/site-page/SitePage'
import { Articles } from './pages/articles/Articles'
import { ArticleDetail } from './pages/articles/ArticleDetail'
import { AdminLogin } from './pages/admin/login/Login'
import { AdminLayout } from './pages/admin/layout/AdminLayout'
import { AdminOverview } from './pages/admin/overview/Overview'
import { AdminProducts } from './pages/admin/products/AdminProducts'
import { AdminOrders } from './pages/admin/orders/AdminOrders'
import { AdminCategories } from './pages/admin/categories/AdminCategories'
import { AdminArticles } from './pages/admin/articles/AdminArticles'
import { AdminAppearance } from './pages/admin/appearance/AdminAppearance'
import { AdminPages } from './pages/admin/pages/AdminPages'

export default function App() {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="san-pham" element={<Products />} />
              <Route path="san-pham/:id" element={<ProductDetail />} />
              <Route path="gioi-thieu" element={<SitePage slug="gioi-thieu" />} />
              <Route
                path="quy-trinh-thu-mua"
                element={<SitePage slug="quy-trinh-thu-mua" />}
              />
              <Route
                path="ve-chung-toi"
                element={<Navigate to="/gioi-thieu" replace />}
              />
              <Route
                path="kiem-dinh"
                element={<Navigate to="/quy-trinh-thu-mua" replace />}
              />
              <Route
                path="cong-nghe"
                element={<Navigate to="/quy-trinh-thu-mua" replace />}
              />
              <Route path="lien-he" element={<SitePage slug="lien-he" />} />
              <Route path="khuyen-mai" element={<SitePage slug="khuyen-mai" />} />
              <Route path="bao-hanh" element={<SitePage slug="bao-hanh" />} />
              <Route path="sua-may" element={<SitePage slug="sua-may" />} />
              <Route path="may-moi" element={<Articles />} />
              <Route path="may-moi/:slug" element={<ArticleDetail />} />
              <Route path="tin-tuc" element={<Navigate to="/may-moi" replace />} />
              <Route path="tin-tuc/:slug" element={<Navigate to="/may-moi" replace />} />
              <Route path="dang-nhap" element={<Navigate to="/" replace />} />
            </Route>

            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="danh-muc" element={<AdminCategories />} />
              <Route path="san-pham" element={<AdminProducts />} />
              <Route path="bai-viet" element={<AdminArticles />} />
              <Route path="trang" element={<AdminPages />} />
              <Route path="don-hang" element={<AdminOrders />} />
              <Route path="giao-dien" element={<AdminAppearance />} />
            </Route>

            <Route path="dashboard" element={<Navigate to="/admin/login" replace />} />
            <Route path="gio-hang" element={<Navigate to="/san-pham" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppearanceProvider>
    </AuthProvider>
  )
}
