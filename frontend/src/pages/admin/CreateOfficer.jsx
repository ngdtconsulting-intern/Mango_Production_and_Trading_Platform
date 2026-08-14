import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageBanner from '../../components/PageBanner';
import { getProvinces, getDistricts, getMunicipalities } from '../../utils/nepalLocations';
import '../../styles/dashboard.css';

const initialOfficerForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  address: { province: '', district: '', municipality: '', ward: '', tole: '' },
  coverageArea: { province: '', district: '', municipality: '' },
};

export default function CreateOfficer() {
  const navigate = useNavigate();
  const [officerForm, setOfficerForm] = useState(initialOfficerForm);
  const [creatingOfficer, setCreatingOfficer] = useState(false);

  const handleOfficerFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [group, key] = name.split('.');
      const updatedGroup = { ...officerForm[group], [key]: value };
      if (key === 'province') {
        updatedGroup.district = '';
        updatedGroup.municipality = '';
      } else if (key === 'district') {
        updatedGroup.municipality = '';
      }
      setOfficerForm({ ...officerForm, [group]: updatedGroup });
    } else {
      setOfficerForm({ ...officerForm, [name]: value });
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setCreatingOfficer(true);
    try {
      const payload = {
        ...officerForm,
        role: 'surveyor',
        address: {
          ...officerForm.address,
          ward: officerForm.address.ward ? Number(officerForm.address.ward) : undefined,
        },
        coverageArea: officerForm.coverageArea,
      };
      await api.post('/admin/staff', payload);
      toast.success('Officer account created successfully');
      navigate('/admin/dashboard');
    } catch (error) {
      const message = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Failed to create officer account';
      toast.error(message);
    } finally {
      setCreatingOfficer(false);
    }
  };

  return (
    <div className="dashboard-container">
      <PageBanner
        variant="admin"
        eyebrow="Admin dashboard"
        title="Create Officer Account"
        subtitle="Set up a new officer, including the district they're assigned to cover."
      />

      <form onSubmit={handleCreateOfficer} style={{ maxWidth: 700 }}>
        <div className="field-grid">
          <label className="field">
            <span>Full name</span>
            <input name="name" value={officerForm.name} onChange={handleOfficerFormChange} required />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" name="email" value={officerForm.email} onChange={handleOfficerFormChange} required />
          </label>
          <label className="field">
            <span>Phone (10 digits)</span>
            <input
              name="phone"
              value={officerForm.phone}
              onChange={handleOfficerFormChange}
              pattern="[0-9]{10}"
              title="10 digit phone number"
              required
            />
          </label>
          <label className="field">
            <span>Password (min 8 chars)</span>
            <input
              type="password"
              name="password"
              value={officerForm.password}
              onChange={handleOfficerFormChange}
              minLength={8}
              required
            />
          </label>
        </div>

        <h3 className="detail-heading">Personal Address</h3>
        <div className="field-grid">
          <label className="field">
            <span>Province</span>
            <select name="address.province" value={officerForm.address.province} onChange={handleOfficerFormChange}>
              <option value="">Select province</option>
              {getProvinces().map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>District</span>
            <select
              name="address.district"
              value={officerForm.address.district}
              onChange={handleOfficerFormChange}
              disabled={!officerForm.address.province}
            >
              <option value="">Select district</option>
              {getDistricts(officerForm.address.province).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Municipality</span>
            <select
              name="address.municipality"
              value={officerForm.address.municipality}
              onChange={handleOfficerFormChange}
              disabled={!officerForm.address.district}
            >
              <option value="">Select municipality</option>
              {getMunicipalities(officerForm.address.province, officerForm.address.district).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Ward number</span>
            <input type="number" name="address.ward" value={officerForm.address.ward} onChange={handleOfficerFormChange} />
          </label>
          <label className="field">
            <span>Tole</span>
            <input name="address.tole" value={officerForm.address.tole} onChange={handleOfficerFormChange} />
          </label>
        </div>

        <div className="dashboard-section-head">
          <h3 className="detail-heading" style={{ margin: 0 }}>Coverage Area (assigned jurisdiction)</h3>
          <button
            type="button"
            className="btn-toggle"
            onClick={() => setOfficerForm({ ...officerForm, coverageArea: { ...officerForm.address } })}
            disabled={!officerForm.address.district}
          >
            Same as personal address
          </button>
        </div>
        <p className="empty-message-small">Where this officer is assigned to work, not necessarily where they live. Reports are routed to officers by this area.</p>
        <div className="field-grid">
          <label className="field">
            <span>Province</span>
            <select name="coverageArea.province" value={officerForm.coverageArea.province} onChange={handleOfficerFormChange}>
              <option value="">Select province</option>
              {getProvinces().map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>District</span>
            <select
              name="coverageArea.district"
              value={officerForm.coverageArea.district}
              onChange={handleOfficerFormChange}
              disabled={!officerForm.coverageArea.province}
              required
            >
              <option value="">Select district</option>
              {getDistricts(officerForm.coverageArea.province).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Municipality</span>
            <select
              name="coverageArea.municipality"
              value={officerForm.coverageArea.municipality}
              onChange={handleOfficerFormChange}
              disabled={!officerForm.coverageArea.district}
            >
              <option value="">Select municipality</option>
              {getMunicipalities(officerForm.coverageArea.province, officerForm.coverageArea.district).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="modal-actions" style={{ marginTop: 24, maxWidth: 480 }}>
          <button className="btn-submit" type="submit" disabled={creatingOfficer}>
            {creatingOfficer ? 'Creating...' : 'Create Officer'}
          </button>
          <button className="btn-cancel" type="button" onClick={() => navigate('/admin/dashboard')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
