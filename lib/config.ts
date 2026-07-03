export const defaultSettings = {
  eventName: "HY Birthday Run 58",
  contactEmail: "hybirthdayrun@gmail.com",
  accountHolder: "MUHAMMAD HANIEF YUHADIAN",
  bankName: "MANDIRI",
  bankAccountNumber: "133.00.1078170.6",
  offlinePrice: 325000,
  virtualPrice: 275000,
  shippingFee: 15000,
  offlineQuota: 325,
  virtualQuota: 75,
  registrationOpensAt: "2026-07-07T00:00:00+07:00",
  registrationClosesAt: "2026-07-31T23:59:59+07:00",
  offlineEventDate: "30 Agustus 2026",
  offlineLocation: "Gudda Coffee, Jakarta Pusat",
  virtualPeriod: "24 Agustus 2026 pukul 06.00 - 30 Agustus 2026 pukul 20.00"
};

export const categoryPrices = {
  Offline: defaultSettings.offlinePrice + defaultSettings.shippingFee,
  Virtual: defaultSettings.virtualPrice + defaultSettings.shippingFee
};

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}
