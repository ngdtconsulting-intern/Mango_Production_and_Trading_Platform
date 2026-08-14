import locations from '../data/nepal-locations.json';

export const getProvinces = () => Object.keys(locations);

export const getDistricts = (province) =>
  province ? Object.keys(locations[province] || {}) : [];

export const getMunicipalities = (province, district) =>
  province && district ? locations[province]?.[district] || [] : [];

export default locations;