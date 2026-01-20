export type PartnerLocation = {
  id: number;
  province_code: string;
  province_name: string;
  hospital_name: string;
  address: string;
  maintenance_count: number;
};

export type ProvincePartner = {
  id: number;
  name: string;
  address: string;
  maintenance: number;
};

export type ProvinceWithPartners = {
  id: string;
  name: string;
  partners: ProvincePartner[];
};
