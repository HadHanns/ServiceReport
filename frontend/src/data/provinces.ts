export type ProvinceOption = {
  code: string;
  name: string;
};

export const provinceOptions: ProvinceOption[] = [
  { code: "11", name: "Aceh" },
  { code: "12", name: "North Sumatra" },
  { code: "13", name: "West Sumatra" },
  { code: "14", name: "Riau" },
  { code: "15", name: "Jambi" },
  { code: "16", name: "South Sumatra" },
  { code: "17", name: "Bengkulu" },
  { code: "18", name: "Lampung" },
  { code: "19", name: "Bangka Belitung Islands" },
  { code: "21", name: "Riau Islands" },
  { code: "31", name: "DKI Jakarta" },
  { code: "32", name: "West Java" },
  { code: "33", name: "Central Java" },
  { code: "34", name: "DI Yogyakarta" },
  { code: "35", name: "East Java" },
  { code: "36", name: "Banten" },
  { code: "51", name: "Bali" },
  { code: "52", name: "West Nusa Tenggara" },
  { code: "53", name: "East Nusa Tenggara" },
  { code: "61", name: "West Kalimantan" },
  { code: "62", name: "Central Kalimantan" },
  { code: "63", name: "South Kalimantan" },
  { code: "64", name: "East Kalimantan" },
  { code: "65", name: "North Kalimantan" },
  { code: "71", name: "North Sulawesi" },
  { code: "72", name: "Central Sulawesi" },
  { code: "73", name: "South Sulawesi" },
  { code: "74", name: "Southeast Sulawesi" },
  { code: "75", name: "Gorontalo" },
  { code: "76", name: "West Sulawesi" },
  { code: "81", name: "Maluku" },
  { code: "82", name: "North Maluku" },
  { code: "91", name: "Papua" },
  { code: "92", name: "West Papua" },
  { code: "93", name: "South Papua" },
  { code: "94", name: "Central Papua" },
  { code: "95", name: "Highland Papua" },
  { code: "96", name: "Southwest Papua" },
];

export const getProvinceOption = (code: string) =>
  provinceOptions.find((province) => province.code === code);
