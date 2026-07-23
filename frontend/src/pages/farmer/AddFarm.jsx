import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../../styles/forms.css';

const VARIETIES = ['Maldaha', 'Amrapali', 'Sindhure', 'Langra', 'Dusehri', 'Chaunsa'];

export default function AddFarm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    farmName: '',
    description: '',
    ward: '',
    tole: '',
    district: '',
    municipality: '',
    orchardAreaKatha: '',
    totalTreeCount: '',
    bearingTreeCount: '',
    soilType: 'loamy',
    terrain: 'flat',
    irrigationSystem: 'rainfed',
    certifications: '',
  });

  const [varietyShares, setVarietyShares] = useState(
    VARIETIES.reduce((acc, v) => ({ ...acc, [v]: '' }), {})
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVarietyChange = (variety, value) => {
    setVarietyShares({ ...varietyShares, [variety]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const varieties = VARIETIES
      .filter((v) => varietyShares[v] !== '')
      .map((v) => ({ name: v, percentage: Number(varietyShares[v]) }));

    try {
      await api.post('/farms', {
        farmName: formData.farmName,
        description: formData.description || undefined,
        location: {
          ward: formData.ward ? Number(formData.ward) : undefined,
          tole: formData.tole || undefined,
          district: formData.district || undefined,
          municipality: formData.municipality || undefined,
        },
        orchardAreaKatha: formData.orchardAreaKatha ? Number(formData.orchardAreaKatha) : undefined,
        totalTreeCount: formData.totalTreeCount ? Number(formData.totalTreeCount) : undefined,
        bearingTreeCount: formData.bearingTreeCount ? Number(formData.bearingTreeCount) : undefined,
        varieties,
        soilType: formData.soilType,
        terrain: formData.terrain,
        irrigationSystem: formData.irrigationSystem,
        certifications: formData.certifications
          ? formData.certifications.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
      });
      toast.success('Farm added successfully');
      navigate('/farmer/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add farm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Add a Farm</h1>
      <form onSubmit={handleSubmit}>

        <h3 className="form-section">Basic Info</h3>
        <label>Farm Name</label>
        <input type="text" name="farmName" value={formData.farmName} onChange={handleChange} required />

        <label>Description (optional)</label>
        <textarea rows="2" name="description" value={formData.description} onChange={handleChange} />

        <h3 className="form-section">Location</h3>
        <div className="form-grid">
          <div>
            <label>Ward</label>
            <input type="number" name="ward" value={formData.ward} onChange={handleChange} />
          </div>
          <div>
            <label>Tole</label>
            <input type="text" name="tole" value={formData.tole} onChange={handleChange} />
          </div>
          <div>
            <label>District</label>
            <input type="text" name="district" value={formData.district} onChange={handleChange} />
          </div>
          <div>
            <label>Municipality</label>
            <input type="text" name="municipality" value={formData.municipality} onChange={handleChange} />
          </div>
        </div>

        <h3 className="form-section">Orchard Size</h3>
        <div className="form-grid">
          <div>
            <label>Area (katha)</label>
            <input type="number" step="0.1" name="orchardAreaKatha" value={formData.orchardAreaKatha} onChange={handleChange} />
          </div>
          <div>
            <label>Total Trees</label>
            <input type="number" name="totalTreeCount" value={formData.totalTreeCount} onChange={handleChange} />
          </div>
          <div>
            <label>Bearing Trees</label>
            <input type="number" name="bearingTreeCount" value={formData.bearingTreeCount} onChange={handleChange} />
          </div>
        </div>

        <h3 className="form-section">Variety Mix (% of trees, optional)</h3>
        <div className="tree-age-grid">
          {VARIETIES.map((v) => (
            <div key={v}>
              <label>{v}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={varietyShares[v]}
                onChange={(e) => handleVarietyChange(v, e.target.value)}
              />
            </div>
          ))}
        </div>

        <h3 className="form-section">Growing Conditions</h3>
        <div className="form-grid">
          <div>
            <label>Soil Type</label>
            <select name="soilType" value={formData.soilType} onChange={handleChange}>
              <option value="loamy">Loamy</option>
              <option value="sandy">Sandy</option>
              <option value="clay">Clay</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label>Terrain</label>
            <select name="terrain" value={formData.terrain} onChange={handleChange}>
              <option value="flat">Flat</option>
              <option value="sloped">Sloped</option>
              <option value="hilly">Hilly</option>
            </select>
          </div>
          <div>
            <label>Irrigation</label>
            <select name="irrigationSystem" value={formData.irrigationSystem} onChange={handleChange}>
              <option value="drip">Drip</option>
              <option value="flood">Flood</option>
              <option value="sprinkler">Sprinkler</option>
              <option value="rainfed">Rainfed</option>
            </select>
          </div>
        </div>

        <h3 className="form-section">Certifications (optional)</h3>
        <label>Comma-separated (e.g. Organic, GAP)</label>
        <input type="text" name="certifications" value={formData.certifications} onChange={handleChange} />

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Add Farm'}
        </button>
      </form>
    </div>
  );
}