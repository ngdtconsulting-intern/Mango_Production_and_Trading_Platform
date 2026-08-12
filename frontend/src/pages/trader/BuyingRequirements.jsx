import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import '../../styles/trader.css';

const VARIETIES = ['Maldaha', 'Amrapali', 'Sindhure', 'Langra', 'Dusehri', 'Chaunsa'];
const PROVINCE_DISTRICTS = {
  Koshi: ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Tehrathum', 'Udayapur'],
  Madhesh: ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  Bagmati: ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchowk', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchowk'],
  Gandaki: ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Manang', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
  Lumbini: ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Parasi', 'Palpa', 'Pyuthan', 'Rolpa', 'Rukum East', 'Rupandehi'],
  Karnali: ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Rukum West', 'Salyan', 'Surkhet'],
  Sudurpashchim: ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur'],
};

export default function CreateRequirement() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    variety: VARIETIES[0],
    quantityMT: '',
    quality: 'good',
    province: '',
    district: '',
    municipality: '',
    minPricePerKg: '',
    maxPricePerKg: '',
    requiredByDate: '',
    phone: '',
    email: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/traders/requirements', {
        variety: formData.variety,
        quantityMT: Number(formData.quantityMT),
        quality: formData.quality,
        location: {
          province: formData.province,
          district: formData.district,
          municipality: formData.municipality,
        },
        budget: {
          minPricePerKg: Number(formData.minPricePerKg),
          maxPricePerKg: Number(formData.maxPricePerKg),
        },
        requiredByDate: formData.requiredByDate,
        contact: {
          phone: formData.phone,
          email: formData.email,
        },
      });
      toast.success('Buying requirement posted');
      navigate('/trader/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post requirement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="trader"
        eyebrow="📝 New requirement"
        title="Post a Buying Requirement"
        subtitle="Tell farmers what you're looking to buy."
      />

      <form onSubmit={handleSubmit} className="application-form" style={{ maxWidth: 480 }}>
        <div className="form-group">
          <label>Variety</label>
          <select name="variety" value={formData.variety} onChange={handleChange}>
            {VARIETIES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Quantity (MT)</label>
          <input type="number" step="0.1" min="0.1" name="quantityMT" value={formData.quantityMT} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Quality</label>
          <select name="quality" value={formData.quality} onChange={handleChange}>
            <option value="premium">Premium</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>

        <div className="form-group">
          <label>Province</label>
          <select
            name="province"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value, district: '' })}
            required
          >
            <option value="">Select Province</option>
            {Object.keys(PROVINCE_DISTRICTS).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>District</label>
          <select
            name="district"
            value={formData.district}
            onChange={handleChange}
            required
            disabled={!formData.province}
          >
            <option value="">{formData.province ? 'Select District' : 'Select province first'}</option>
            {(PROVINCE_DISTRICTS[formData.province] || []).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Municipality</label>
          <input type="text" name="municipality" value={formData.municipality} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Min Price (Rs/kg)</label>
          <input type="number" step="0.01" name="minPricePerKg" value={formData.minPricePerKg} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Max Price (Rs/kg)</label>
          <input type="number" step="0.01" name="maxPricePerKg" value={formData.maxPricePerKg} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Required By</label>
          <input type="date" name="requiredByDate" value={formData.requiredByDate} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Contact Phone</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Contact Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="modal-actions">
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post Requirement'}
          </button>
        </div>
      </form>
    </div>
  );
}
