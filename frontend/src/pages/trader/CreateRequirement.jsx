import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import { getProvinces, getDistricts, getMunicipalities } from '../../utils/nepalLocations';
import '../../styles/trader.css';

const VARIETIES = ['Maldaha', 'Amrapali', 'Sindhure', 'Langra', 'Dusehri', 'Chaunsa'];

// Mirrors backend/controllers/traderController.js QUALITY_PRICE_OFFSET, kept
// in sync manually since there's no shared package between front/backend.
const QUALITY_PRICE_OFFSET = {
  fair: { min: -10, max: -1 },
  good: { min: -5, max: 5 },
  premium: { min: 1, max: 10 },
};

export default function CreateRequirement() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [referencePrice, setReferencePrice] = useState(null);
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

  useEffect(() => {
    if (!formData.district || !formData.variety) {
      setReferencePrice(null);
      return;
    }
    let cancelled = false;
    api.get('/market/latest', { params: { district: formData.district, variety: formData.variety } })
      .then(({ data }) => {
        if (cancelled) return;
        setReferencePrice(data.data?.[0] || null);
      })
      .catch(() => {
        if (!cancelled) setReferencePrice(null);
      });
    return () => { cancelled = true; };
  }, [formData.district, formData.variety]);

  const allowedRange = referencePrice
    ? (() => {
        const offset = QUALITY_PRICE_OFFSET[formData.quality] || QUALITY_PRICE_OFFSET.good;
        return {
          min: referencePrice.wholesalePricePerKg + offset.min,
          max: referencePrice.wholesalePricePerKg + offset.max,
        };
      })()
    : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    if (name === 'province') {
      updated.district = '';
      updated.municipality = '';
    } else if (name === 'district') {
      updated.municipality = '';
    }
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (allowedRange) {
      const min = Number(formData.minPricePerKg);
      const max = Number(formData.maxPricePerKg);
      if (min < allowedRange.min || max > allowedRange.max) {
        toast.error(`For ${formData.quality} quality, price must be between Rs. ${allowedRange.min} and Rs. ${allowedRange.max}/kg.`);
        return;
      }
    }

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
        eyebrow="New requirement"
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
          <select name="province" value={formData.province} onChange={handleChange} required>
            <option value="">Select Province</option>
            {getProvinces().map((p) => (
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
            {getDistricts(formData.province).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Municipality</label>
          <select
            name="municipality"
            value={formData.municipality}
            onChange={handleChange}
            required
            disabled={!formData.district}
          >
            <option value="">{formData.district ? 'Select Municipality' : 'Select district first'}</option>
            {getMunicipalities(formData.province, formData.district).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {formData.district && (
          <p className="empty-message-small">
            {referencePrice
              ? `Officer reference price for ${formData.variety} in ${formData.district}: Rs. ${referencePrice.wholesalePricePerKg}/kg wholesale. `
                + `At ${formData.quality} quality, you can offer Rs. ${allowedRange.min} to Rs. ${allowedRange.max}/kg.`
              : `No officer price set yet for ${formData.variety} in ${formData.district}, any price is accepted for now.`}
          </p>
        )}

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
