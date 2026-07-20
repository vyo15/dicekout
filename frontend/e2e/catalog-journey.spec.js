import { expect, test } from "@playwright/test";

const expectNoHorizontalOverflow = async (page) => {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
};

test("pengunjung dapat mencari, membuka detail, refresh langsung, dan kembali ke katalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Pilih yang kamu mau/i })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "DicekOut");

  const searchForm = page.getByRole("search");
  const search = searchForm.getByRole("combobox", { name: "Cari produk" });
  await search.fill("lampu meja");
  await searchForm.getByRole("button", { name: "Cari", exact: true }).click();

  await expect(page).toHaveURL(/\/produk\?q=lampu(?:\+|%20)meja$/);
  await expect(page.getByRole("heading", { level: 2, name: /Hasil untuk “lampu meja”/i })).toBeVisible();

  await page.getByRole("link", { name: "Lampu Meja LED Minimalis", exact: true }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Lampu Meja LED Minimalis" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Marketplace belum tersedia", exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Lampu Meja LED Minimalis" })).toBeVisible();

  await page.getByRole("button", { name: "Kembali ke daftar sebelumnya" }).click();
  await expect(page).toHaveURL(/\/produk\?q=lampu(?:\+|%20)meja$/);
  await expectNoHorizontalOverflow(page);
});

test("parameter katalog tidak valid dibersihkan dan canonical tetap ke halaman utama katalog", async ({ page }) => {
  await page.goto("/produk?q=%20%20lampu%20%20meja%20%20&kategori=tidak-ada&koleksi=invalid&urut=acak&pilihan=0&terbaru=yes");

  await expect(page).toHaveURL(/\/produk\?q=lampu(?:\+|%20)meja$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://dicekout.id/produk");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await expect(page.getByText("Pencarian: lampu meja")).toBeVisible();
});

test("route yang tidak tersedia menampilkan 404 yang dapat dipulihkan", async ({ page }) => {
  await page.goto("/produk/produk-yang-tidak-ada");
  await expect(page.getByRole("heading", { level: 1, name: /tidak ditemukan/i })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await page.getByRole("link", { name: "Kembali ke beranda", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("navigasi dan filter mobile tetap dapat digunakan tanpa overflow", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile"), "Skenario khusus viewport mobile");
  await page.goto("/produk");
  await expect(page.getByRole("navigation", { name: "Navigasi utama mobile" })).toBeVisible();
  await page.getByRole("button", { name: "Filter" }).click();
  const filterDialog = page.getByRole("dialog", { name: "Filter Produk" });
  await expect(filterDialog).toBeVisible();
  await filterDialog.getByRole("button", { name: "Tutup filter", exact: true }).click();
  await expect(filterDialog).toBeHidden();
  await expectNoHorizontalOverflow(page);
});
