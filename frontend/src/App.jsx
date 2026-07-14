import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import SiteLayout from "./components/layout/SiteLayout.jsx";
import LoadingScreen from "./components/feedback/LoadingScreen.jsx";
import ScrollToTop from "./components/common/ScrollToTop.jsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const ProductsPage = lazy(() => import("./pages/ProductsPage.jsx"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage.jsx"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage.jsx"));
const CategoryPage = lazy(() => import("./pages/CategoryPage.jsx"));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage.jsx"));
const CollectionPage = lazy(() => import("./pages/CollectionPage.jsx"));
const SavedProductsPage = lazy(() => import("./pages/SavedProductsPage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const DisclosurePage = lazy(() => import("./pages/DisclosurePage.jsx"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

const App = () => (
  <>
    <ScrollToTop />
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="produk" element={<ProductsPage />} />
          <Route path="produk/:slug" element={<ProductDetailPage />} />
          <Route path="tersimpan" element={<SavedProductsPage />} />
          <Route path="kategori" element={<CategoriesPage />} />
          <Route path="kategori/:slug" element={<CategoryPage />} />
          <Route path="koleksi" element={<CollectionsPage />} />
          <Route path="koleksi/:slug" element={<CollectionPage />} />
          <Route path="tentang" element={<AboutPage />} />
          <Route path="disclosure" element={<DisclosurePage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  </>
);

export default App;
