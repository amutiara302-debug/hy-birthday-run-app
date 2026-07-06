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
  registrationOpensAt: "2026-07-07T16:00:00+07:00",
  registrationClosesAt: "2026-07-31T11:59:00+07:00",
  offlineEventDate: "30 Agustus 2026",
  offlineLocation: "Gudda Coffee, Jakarta Pusat",
  offlineAddress: "Jalan Manila No. 47, Jakarta Pusat, Jakarta 10270",
  mapDirectionUrl: "https://maps.apple.com/place?ull=-6.2365241050720215%2C106.84642791748047&place-id=I94A5B45F31DBE8A3&address=Jalan+Manila+No.+47%2C+Central+Jakarta%2C+Jakarta+10270%2C+Indonesia&coordinate=-6.222963%2C106.801453&name=Gudda+Coffee&_provider=9902",
  virtualPeriod: "24 Agustus 2026 pukul 06.00 - 30 Agustus 2026 pukul 20.00"
};

export const shirtSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
export const premiumShirtSizes = ["3XL", "4XL", "5XL"];
export const premiumShirtFee = 10000;

export const categoryPrices = {
  Offline: defaultSettings.offlinePrice + defaultSettings.shippingFee,
  Virtual: defaultSettings.virtualPrice + defaultSettings.shippingFee
};

export function getShirtSurcharge(size: string) {
  return premiumShirtSizes.includes(size) ? premiumShirtFee : 0;
}

export function getRegistrationTotal(category: keyof typeof categoryPrices, size: string) {
  return categoryPrices[category] + getShirtSurcharge(size);
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}
